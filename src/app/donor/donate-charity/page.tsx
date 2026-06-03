import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import DonateCharityForm from './DonateCharityForm';

export const dynamic = 'force-dynamic';

async function getApprovedCharities() {
  const charities = await prisma.charityProfile.findMany({
    where: { isApproved: true },
    select: {
      id: true,
      charityName: true,
      licenseNumber: true,
      description: true,
      phone: true,
    },
    orderBy: { charityName: 'asc' },
  });
  return charities;
}

export default async function DonateCharityPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'DONOR') {
    redirect('/donor/dashboard');
  }

  const charities = await getApprovedCharities();

  return (
    <div className="flex-1 bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <DonateCharityForm charities={charities} />
      </div>
    </div>
  );
}
