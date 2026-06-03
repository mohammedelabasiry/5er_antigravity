import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role, BeneficiaryStatus, ContributionStatus, ContributionType, DeliveryStatus } from '@prisma/client';
import { syncBeneficiaryCapStatus, getReceivedThisMonth } from '@/lib/capLogic';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === Role.ADMIN || session.role === Role.SUPER_ADMIN;
    const isCharity = session.role === Role.CHARITY_ADMIN;

    if (!isAdmin && !isCharity) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      resourceType,
      quantity = 1,
      estimatedValue = 0,
      areaName = 'All',
      category = 'All',
      forceOverride = false,
      deductStock = false,
      notes = '',
    } = body;

    const parsedQty = Number(quantity);
    const parsedValue = Number(estimatedValue);

    if (!resourceType || parsedQty <= 0 || parsedValue <= 0) {
      return NextResponse.json({ error: 'Invalid resource distribution parameters' }, { status: 400 });
    }

    // 1. Resolve Charity Profile ID if Charity Admin is distributing
    let charityProfileId: string | null = null;
    if (isCharity) {
      const charity = await prisma.charityProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!charity) {
        return NextResponse.json({ error: 'Charity organization profile not found' }, { status: 404 });
      }
      if (!charity.isApproved) {
        return NextResponse.json({ error: 'Your charity is pending admin approval' }, { status: 403 });
      }
      charityProfileId = charity.id;
    }

    // 2. Fetch matching active beneficiaries
    const whereClause: any = {
      status: {
        in: [BeneficiaryStatus.APPROVED, BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH],
      },
    };

    if (areaName && areaName !== 'All') {
      whereClause.areaName = areaName;
    }
    if (category && category !== 'All') {
      whereClause.category = category;
    }

    const beneficiaries = await prisma.beneficiaryProfile.findMany({
      where: whereClause,
    });

    if (beneficiaries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active beneficiaries matched the selected filters.',
        totalTargeted: 0,
        totalSucceeded: 0,
        totalSkipped: 0,
      });
    }

    // 3. Verify and deduct stock if requested
    const totalRequiredStock = beneficiaries.length * parsedQty;
    if (deductStock) {
      const stockItem = await prisma.resourceStock.findUnique({
        where: { resourceType },
      });

      if (!stockItem || stockItem.quantity < totalRequiredStock) {
        return NextResponse.json({
          error: `Insufficient stock. Required: ${totalRequiredStock} ${stockItem?.unit || 'units'}, Available: ${stockItem?.quantity || 0} ${stockItem?.unit || 'units'}.`,
        }, { status: 400 });
      }
    }

    // 4. Distribute
    let succeededCount = 0;
    let skippedCount = 0;

    await prisma.$transaction(async (tx) => {
      // Deduct stock first
      if (deductStock) {
        await tx.resourceStock.update({
          where: { resourceType },
          data: {
            quantity: {
              decrement: totalRequiredStock,
            },
          },
        });
      }

      // Process each beneficiary
      for (const ben of beneficiaries) {
        // Cap checks
        const received = await getReceivedThisMonth(ben.id);
        const remainingCap = ben.monthlySupportCap - received;

        // Skip if cap is exceeded and we are not overriding
        if (remainingCap < parsedValue && !forceOverride && !ben.isEligibleOverride) {
          skippedCount++;
          continue;
        }

        succeededCount++;

        // Create contribution
        const contribution = await tx.contribution.create({
          data: {
            beneficiaryProfileId: ben.id,
            charityProfileId,
            amount: parsedValue,
            type: ContributionType.RESOURCE,
            status: ContributionStatus.DELIVERED,
            resourceType,
            resourceQuantity: parsedQty,
            notes: notes || 'Bulk campaign distribution.',
          },
        });

        // Create distribution record
        await tx.resourceDistribution.create({
          data: {
            contributionId: contribution.id,
            beneficiaryProfileId: ben.id,
            charityProfileId,
            resourceType,
            quantity: parsedQty,
            estimatedValue: parsedValue,
            deliveryStatus: DeliveryStatus.DELIVERED,
            notes: notes || 'Direct bulk campaign dispatch.',
          },
        });

        // Send Notification
        await tx.notification.create({
          data: {
            userId: ben.userId,
            title: 'Physical Aid Distributed!',
            message: `Alhamdulillah! You received a "${resourceType}" (${parsedQty} units) from a bulk aid campaign.`,
            type: 'CONTRIBUTION_RECEIVED',
          },
        });
      }
    });

    // 5. Synchronize all caps for succeeded beneficiaries (run outside txn to prevent locking)
    for (const ben of beneficiaries) {
      const received = await getReceivedThisMonth(ben.id);
      const remainingCap = ben.monthlySupportCap - received;
      // Only sync if the beneficiary actually received the aid
      if (remainingCap < parsedValue && !forceOverride && !ben.isEligibleOverride) {
        continue;
      }
      await syncBeneficiaryCapStatus(ben.id);
    }

    // 6. Log Audit Trail
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CAMPAIGN_DISTRIBUTION_EXECUTED',
        details: `Executed bulk campaign "${resourceType}" targeting ${beneficiaries.length} cases (Area: ${areaName}, Bracket: ${category}). Succeeded: ${succeededCount}, Skipped: ${skippedCount}. Total EGP Value: ${succeededCount * parsedValue}. Deducted Stock: ${deductStock}`,
      },
    });

    return NextResponse.json({
      success: true,
      totalTargeted: beneficiaries.length,
      totalSucceeded: succeededCount,
      totalSkipped: skippedCount,
    });
  } catch (error: any) {
    console.error('Campaign distribution error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
