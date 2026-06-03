import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import BulkDonateForm from './BulkDonateForm';

export const dynamic = 'force-dynamic';

export default async function BulkDonatePage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'DONOR') {
    redirect('/donor/dashboard');
  }

  return (
    <div className="flex-1 bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <BulkDonateForm />
      </div>
    </div>
  );
}
