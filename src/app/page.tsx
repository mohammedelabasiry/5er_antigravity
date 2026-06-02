import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import LandingHero from '@/components/LandingHero';

export const dynamic = 'force-dynamic';

async function getStats() {
  const totalBeneficiaries = await prisma.beneficiaryProfile.count({
    where: { status: { in: ['APPROVED', 'FULLY_SUPPORTED_THIS_MONTH'] } },
  });
  
  const fullySupported = await prisma.beneficiaryProfile.count({
    where: { status: 'FULLY_SUPPORTED_THIS_MONTH' },
  });

  const contributions = await prisma.contribution.findMany({
    where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
    select: { amount: true },
  });

  const totalDonated = contributions.reduce((sum, c) => sum + c.amount, 0);

  const totalCharities = await prisma.charityProfile.count({
    where: { isApproved: true },
  });

  return {
    totalBeneficiaries,
    fullySupported,
    totalDonated,
    totalCharities,
  };
}

export default async function LandingPage() {
  const stats = await getStats();
  const session = await getSession();

  const clientSession = session ? {
    role: session.role,
    name: session.name,
    email: session.email
  } : null;

  return <LandingHero stats={stats} session={clientSession} />;
}
