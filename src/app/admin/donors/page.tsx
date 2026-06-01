import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ArrowLeft, Users } from 'lucide-react';
import DonorList from './DonorList';

export const dynamic = 'force-dynamic';

async function getDonors() {
  const donors = await prisma.donorProfile.findMany({
    include: {
      user: {
        select: {
          email: true,
          isBlocked: true,
          createdAt: true,
        },
      },
      contributions: {
        where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return donors.map((d) => {
    const totalDonated = d.contributions.reduce((sum, c) => sum + c.amount, 0);
    return {
      id: d.id,
      userId: d.userId,
      displayName: d.displayName,
      phone: d.phone,
      bio: d.bio,
      email: d.user.email,
      isBlocked: d.user.isBlocked,
      createdAt: d.createdAt,
      donationsCount: d.contributions.length,
      totalDonated,
    };
  });
}

export default async function AdminDonorsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const donors = await getDonors();

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
            <Users className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Donors Directory
            </h1>
            <p className="text-xs text-slate-500">
              Manage platform donors, review contribution tallies, and toggle access states.
            </p>
          </div>
        </div>

        {/* Interactive Donor List */}
        <DonorList initialDonors={donors} />
      </div>
    </div>
  );
}
