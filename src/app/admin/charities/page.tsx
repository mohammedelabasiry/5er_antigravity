import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ArrowLeft, Building } from 'lucide-react';
import CharityList from './CharityList';

export const dynamic = 'force-dynamic';

async function getCharities() {
  return prisma.charityProfile.findMany({
    include: {
      user: { select: { email: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminCharitiesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const charities = await getCharities();

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-3">
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Building className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Charity Organizations Directory
            </h1>
            <p className="text-xs text-slate-500">
              Review charity licenses, details, and manage platform permission states.
            </p>
          </div>
        </div>

        {/* Interactive Charity List */}
        <CharityList initialCharities={charities} />
      </div>
    </div>
  );
}
