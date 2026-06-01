import { prisma } from './db';
import { BeneficiaryStatus, ContributionStatus } from '@prisma/client';

export function getCurrentMonthRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startOfMonth, endOfMonth };
}

/**
 * Calculates total amount received in the current calendar month
 * from CONFIRMED or DELIVERED contributions.
 */
export async function getReceivedThisMonth(beneficiaryProfileId: string): Promise<number> {
  const { startOfMonth, endOfMonth } = getCurrentMonthRange();

  const contributions = await prisma.contribution.findMany({
    where: {
      beneficiaryProfileId,
      status: {
        in: [ContributionStatus.CONFIRMED, ContributionStatus.DELIVERED],
      },
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  return contributions.reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Dynamically computes received amount and synchronizes the beneficiary status
 * between APPROVED and FULLY_SUPPORTED_THIS_MONTH, updating the database record.
 */
export async function syncBeneficiaryCapStatus(beneficiaryProfileId: string): Promise<{
  received: number;
  cap: number;
  status: BeneficiaryStatus;
}> {
  const profile = await prisma.beneficiaryProfile.findUnique({
    where: { id: beneficiaryProfileId },
  });

  if (!profile) {
    throw new Error('Beneficiary profile not found');
  }

  const received = await getReceivedThisMonth(beneficiaryProfileId);
  const cap = profile.monthlySupportCap;

  let nextStatus = profile.status;

  // Transition rules:
  // If active (APPROVED or FULLY_SUPPORTED_THIS_MONTH) and threshold reached, mark as fully supported.
  // Unless an admin override allows unlimited additional contributions.
  if (received >= cap && !profile.isEligibleOverride) {
    if (profile.status === BeneficiaryStatus.APPROVED) {
      nextStatus = BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH;
      
      // Log audit action and create notification
      await prisma.notification.create({
        data: {
          userId: profile.userId,
          title: 'Monthly Cap Completed!',
          message: `Alhamdulillah! Your required monthly support of ${cap} EGP has been fully covered.`,
          type: 'SUPPORT_CAP',
        },
      });
    }
  } else {
    // If support falls below cap (e.g. contribution cancelled) or has override, restore to APPROVED
    if (profile.status === BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH) {
      nextStatus = BeneficiaryStatus.APPROVED;
    }
  }

  const updated = await prisma.beneficiaryProfile.update({
    where: { id: beneficiaryProfileId },
    data: {
      monthlyReceivedAmount: received,
      status: nextStatus,
    },
  });

  // Track in MonthlySupportCycle database history
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  await prisma.monthlySupportCycle.upsert({
    where: {
      beneficiaryProfileId_year_month: {
        beneficiaryProfileId,
        year,
        month,
      },
    },
    update: {
      receivedAmount: received,
      targetAmount: cap,
      status: profile.isEligibleOverride ? 'OVERRIDDEN' : (received >= cap ? 'COMPLETED' : 'IN_PROGRESS'),
    },
    create: {
      beneficiaryProfileId,
      year,
      month,
      targetAmount: cap,
      receivedAmount: received,
      status: profile.isEligibleOverride ? 'OVERRIDDEN' : (received >= cap ? 'COMPLETED' : 'IN_PROGRESS'),
    },
  });

  return {
    received,
    cap,
    status: updated.status,
  };
}
