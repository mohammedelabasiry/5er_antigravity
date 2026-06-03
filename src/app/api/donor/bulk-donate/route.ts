import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReceivedThisMonth, syncBeneficiaryCapStatus } from '@/lib/capLogic';
import { BeneficiaryStatus, ContributionStatus, ContributionType, Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.DONOR) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const body = await request.json();
    const {
      totalAmount,
      category,
      areaName,
      maxPerBeneficiary,
      forceOverride,
    } = body;

    const parsedTotalAmount = Number(totalAmount) || 0;
    if (parsedTotalAmount <= 0) {
      return NextResponse.json({ error: 'Total donation amount must be greater than zero EGP.' }, { status: 400 });
    }

    // 1. Resolve Donor Profile
    const donor = await prisma.donorProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!donor) {
      return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 });
    }

    // 2. Build Query Filters for Beneficiary Profiles
    const whereClause: any = {
      status: BeneficiaryStatus.APPROVED,
    };

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (areaName && areaName !== 'ALL') {
      whereClause.areaName = areaName;
    }

    // Fetch matching beneficiaries
    const beneficiaries = await prisma.beneficiaryProfile.findMany({
      where: whereClause,
      orderBy: [
        { evaluationScore: 'desc' },
        { monthlyReceivedAmount: 'asc' },
      ],
    });

    if (beneficiaries.length === 0) {
      return NextResponse.json({
        error: 'No active beneficiaries found matching these criteria.',
      }, { status: 400 });
    }

    // 3. Process distribution
    let remainingBulkAmount = parsedTotalAmount;
    const assistedBeneficiaries: Array<{ id: string; amount: number; code: string; userId: string }> = [];

    for (const b of beneficiaries) {
      if (remainingBulkAmount <= 0) break;

      // Calculate remaining monthly cap
      const currentReceived = await getReceivedThisMonth(b.id);
      const remainingCap = Math.max(0, b.monthlySupportCap - currentReceived);

      if (remainingCap <= 0 && !forceOverride) {
        continue; // Skip if already fully supported and cap override not set
      }

      // Calculate individual donation amount
      let individualAmount = 0;
      if (forceOverride) {
        individualAmount = maxPerBeneficiary ? Number(maxPerBeneficiary) : 1000; // default cap of 1k if no limit set
      } else {
        individualAmount = remainingCap;
        if (maxPerBeneficiary && Number(maxPerBeneficiary) < individualAmount) {
          individualAmount = Number(maxPerBeneficiary);
        }
      }

      // Don't donate more than what is left in the bulk amount
      if (individualAmount > remainingBulkAmount) {
        individualAmount = remainingBulkAmount;
      }

      if (individualAmount <= 0) continue;

      assistedBeneficiaries.push({
        id: b.id,
        amount: individualAmount,
        code: b.code,
        userId: b.userId,
      });

      remainingBulkAmount -= individualAmount;
    }

    if (assistedBeneficiaries.length === 0) {
      return NextResponse.json({
        error: 'All matching beneficiaries have already received their full support cap for this month.',
      }, { status: 400 });
    }

    const totalDistributed = parsedTotalAmount - remainingBulkAmount;

    // 4. Create Contributions in Transaction
    await prisma.$transaction(async (tx) => {
      for (const item of assistedBeneficiaries) {
        await tx.contribution.create({
          data: {
            beneficiaryProfileId: item.id,
            donorProfileId: donor.id,
            amount: item.amount,
            type: ContributionType.CASH,
            status: ContributionStatus.CONFIRMED,
            notes: 'Distributed via Bulk Smart Campaign.',
          },
        });

        // Notify beneficiary
        await tx.notification.create({
          data: {
            userId: item.userId,
            title: 'Contribution Received!',
            message: `Alhamdulillah! You received ${item.amount} EGP worth of cash support distributed via a smart bulk donor campaign.`,
            type: 'CONTRIBUTION_RECEIVED',
          },
        });
      }

      // Audit Trail
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'BULK_DONATION_EXECUTED',
          details: `Executed bulk donation of ${totalDistributed} EGP. Assisted ${assistedBeneficiaries.length} families. Category: ${category || 'ALL'}, Area: ${areaName || 'ALL'}`,
        },
      });
    });

    // 5. Update cached caps and status cycles sequentially (outside tx to avoid locks)
    for (const item of assistedBeneficiaries) {
      await syncBeneficiaryCapStatus(item.id);
    }

    return NextResponse.json({
      success: true,
      familiesAssisted: assistedBeneficiaries.length,
      totalDistributed,
    });

  } catch (error: any) {
    console.error('Bulk donation route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
