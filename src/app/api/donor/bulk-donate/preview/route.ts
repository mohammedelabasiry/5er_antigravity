import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReceivedThisMonth } from '@/lib/capLogic';
import { BeneficiaryStatus, Role } from '@prisma/client';

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

    // Build Query Filters
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

    let remainingBulkAmount = parsedTotalAmount > 0 ? parsedTotalAmount : 100000; // default simulation sum to show estimate
    let matchingFamiliesCount = 0;
    let simulatedTotalDistributed = 0;
    const simulatedDistributions: number[] = [];

    for (const b of beneficiaries) {
      if (remainingBulkAmount <= 0) break;

      const currentReceived = await getReceivedThisMonth(b.id);
      const remainingCap = Math.max(0, b.monthlySupportCap - currentReceived);

      if (remainingCap <= 0 && !forceOverride) {
        continue;
      }

      let individualAmount = 0;
      if (forceOverride) {
        individualAmount = maxPerBeneficiary ? Number(maxPerBeneficiary) : 1000;
      } else {
        individualAmount = remainingCap;
        if (maxPerBeneficiary && Number(maxPerBeneficiary) < individualAmount) {
          individualAmount = Number(maxPerBeneficiary);
        }
      }

      if (individualAmount > remainingBulkAmount) {
        individualAmount = remainingBulkAmount;
      }

      if (individualAmount <= 0) continue;

      simulatedDistributions.push(individualAmount);
      simulatedTotalDistributed += individualAmount;
      remainingBulkAmount -= individualAmount;
      matchingFamiliesCount++;
    }

    const averageSupport = matchingFamiliesCount > 0 
      ? Math.round(simulatedTotalDistributed / matchingFamiliesCount) 
      : 0;

    return NextResponse.json({
      success: true,
      matchingFamilies: matchingFamiliesCount,
      estimatedDistribution: simulatedTotalDistributed,
      averageSupportPerFamily: averageSupport,
      totalMatchedInSystem: beneficiaries.length,
    });

  } catch (error: any) {
    console.error('Bulk donation preview error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
