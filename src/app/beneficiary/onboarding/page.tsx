import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import OnboardingForm from './OnboardingForm';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'BENEFICIARY') {
    redirect('/');
  }

  const profile = await prisma.beneficiaryProfile.findUnique({
    where: { userId: session.userId },
  });

  if (profile) {
    redirect('/beneficiary/dashboard');
  }

  return (
    <div className="flex-1 bg-slate-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <OnboardingForm />
      </div>
    </div>
  );
}
