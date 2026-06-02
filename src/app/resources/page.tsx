import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import ResourceClientPage from './ResourceClientPage';

export const dynamic = 'force-dynamic';

async function getResourceDistributions(session: { userId: string; role: string }) {
  const { userId, role } = session;
  let dists: any[] = [];

  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    dists = await prisma.resourceDistribution.findMany({
      include: {
        beneficiaryProfile: { select: { code: true, displayName: true } },
        charityProfile: { select: { charityName: true } },
        donorProfile: { select: { displayName: true } },
      },
      orderBy: { date: 'desc' },
    });
  } else if (role === Role.BENEFICIARY) {
    const beneficiary = await prisma.beneficiaryProfile.findUnique({
      where: { userId },
    });
    if (!beneficiary) return [];

    const raw = await prisma.resourceDistribution.findMany({
      where: { beneficiaryProfileId: beneficiary.id },
      include: {
        beneficiaryProfile: { select: { code: true, displayName: true } },
        charityProfile: { select: { charityName: true } },
        donorProfile: { select: { id: true } }, // Keep details anonymized
      },
      orderBy: { date: 'desc' },
    });

    dists = raw.map((d) => ({
      ...d,
      donorProfile: d.donorProfile ? { displayName: 'Anonymous Supporter' } : null,
    }));
  } else if (role === Role.DONOR) {
    const donor = await prisma.donorProfile.findUnique({
      where: { userId },
    });
    if (!donor) return [];

    dists = await prisma.resourceDistribution.findMany({
      where: { donorProfileId: donor.id },
      include: {
        beneficiaryProfile: { select: { code: true, displayName: true } },
        charityProfile: { select: { charityName: true } },
        donorProfile: { select: { displayName: true } },
      },
      orderBy: { date: 'desc' },
    });
  } else if (role === Role.CHARITY_ADMIN) {
    const charity = await prisma.charityProfile.findUnique({
      where: { userId },
    });
    if (!charity) return [];

    dists = await prisma.resourceDistribution.findMany({
      where: { charityProfileId: charity.id },
      include: {
        beneficiaryProfile: { select: { code: true, displayName: true } },
        charityProfile: { select: { charityName: true } },
        donorProfile: { select: { displayName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // Convert Date objects to ISO string dates for Next.js hydration safety
  return dists.map((d) => ({
    ...d,
    date: d.date instanceof Date ? d.date.toISOString() : String(d.date),
  }));
}

export default async function ResourcesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const distributions = await getResourceDistributions(session);

  return (
    <ResourceClientPage
      initialDistributions={distributions}
      userRole={session.role}
    />
  );
}
