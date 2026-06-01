import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReceivedThisMonth, syncBeneficiaryCapStatus } from '@/lib/capLogic';
import { ContributionStatus, ContributionType, DeliveryStatus, Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { beneficiaryProfileId, amount, type, resourceType, quantity, notes } = await request.json();
    const parsedAmount = Number(amount) || 0;

    if (parsedAmount <= 0) {
      return NextResponse.json({ error: 'Donation amount must be greater than zero EGP.' }, { status: 400 });
    }

    // 1. Resolve Donor/Charity Profiles
    let donorProfileId = null;
    let charityProfileId = null;

    if (session.role === Role.DONOR) {
      const donor = await prisma.donorProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!donor) return NextResponse.json({ error: 'Donor profile not found' }, { status: 404 });
      donorProfileId = donor.id;
    } else if (session.role === Role.CHARITY_ADMIN) {
      const charity = await prisma.charityProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!charity) return NextResponse.json({ error: 'Charity organization profile not found' }, { status: 404 });
      if (!charity.isApproved) {
        return NextResponse.json({ error: 'Your charity organization is pending admin approval.' }, { status: 403 });
      }
      charityProfileId = charity.id;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Resolve Beneficiary & Validate Caps
    const beneficiary = await prisma.beneficiaryProfile.findUnique({
      where: { id: beneficiaryProfileId },
    });

    if (!beneficiary) {
      return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });
    }

    // Real-time Cap Validation
    const currentReceived = await getReceivedThisMonth(beneficiaryProfileId);
    const remainingCap = beneficiary.monthlySupportCap - currentReceived;

    if (remainingCap <= 0 && !beneficiary.isEligibleOverride) {
      return NextResponse.json({
        error: 'This beneficiary has already received the full eligible monthly support for this month.',
      }, { status: 400 });
    }

    if (parsedAmount > remainingCap && !beneficiary.isEligibleOverride) {
      return NextResponse.json({
        error: `This contribution exceeds the remaining monthly limit. You can donate up to ${remainingCap} EGP.`,
      }, { status: 400 });
    }

    // 3. Database Transaction
    const contribution = await prisma.$transaction(async (tx) => {
      const contr = await tx.contribution.create({
        data: {
          beneficiaryProfileId,
          donorProfileId,
          charityProfileId,
          amount: parsedAmount,
          type: type as ContributionType,
          status: type === ContributionType.CASH ? ContributionStatus.CONFIRMED : ContributionStatus.PENDING,
          resourceType: type === ContributionType.RESOURCE ? resourceType : null,
          resourceQuantity: type === ContributionType.RESOURCE ? Number(quantity) || 1 : null,
          notes: notes || 'Simulated secure Sadaqah contribution.',
        },
      });

      // If physical assets, create distribution pipeline record
      if (type === ContributionType.RESOURCE) {
        await tx.resourceDistribution.create({
          data: {
            contributionId: contr.id,
            beneficiaryProfileId,
            donorProfileId,
            charityProfileId,
            resourceType: resourceType || 'Physical support package',
            quantity: Number(quantity) || 1,
            estimatedValue: parsedAmount,
            deliveryStatus: DeliveryStatus.PENDING,
            notes: notes || 'Direct dispatch queue initialized.',
          },
        });
      }

      // Notify beneficiary
      const giverDisplay = session.role === Role.DONOR ? 'A generous donor' : 'A charity representative';
      await tx.notification.create({
        data: {
          userId: beneficiary.userId,
          title: 'Contribution Received!',
          message: `Alhamdulillah! You received ${parsedAmount} EGP worth of ${type.toLowerCase()} support from ${giverDisplay}.`,
          type: 'CONTRIBUTION_RECEIVED',
        },
      });

      // Audit Trail
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: 'DONATION_CREATED',
          details: `Donated ${parsedAmount} EGP (${type}) to beneficiary ${beneficiary.code}. Status: ${contr.status}`,
        },
      });

      return contr;
    });

    // 4. Update the beneficiary cache & cycle history
    await syncBeneficiaryCapStatus(beneficiaryProfileId);

    return NextResponse.json({ success: true, contributionId: contribution.id });
  } catch (error: any) {
    console.error('Donate API transaction error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
