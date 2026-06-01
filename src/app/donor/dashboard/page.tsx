import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Heart,
  Coins,
  MapPin,
  Calendar,
  Search,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { BeneficiaryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getDonorData(userId: string) {
  const profile = await prisma.donorProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const contributions = await prisma.contribution.findMany({
    where: { donorProfileId: profile.id },
    include: {
      beneficiaryProfile: {
        select: {
          code: true,
          displayName: true,
          category: true,
          areaName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalDonated = contributions
    .filter((c) => c.status === 'CONFIRMED' || c.status === 'DELIVERED')
    .reduce((sum, c) => sum + c.amount, 0);

  // Get active approved cases that still need support (monthlyReceivedAmount < monthlySupportCap)
  const activeCases = await prisma.beneficiaryProfile.findMany({
    where: {
      status: BeneficiaryStatus.APPROVED,
    },
    orderBy: {
      evaluationScore: 'desc',
    },
    take: 6,
  });

  return {
    profile,
    contributions,
    totalDonated,
    activeCases,
  };
}

export default async function DonorDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'DONOR') {
    redirect('/');
  }

  const data = await getDonorData(session.userId);
  if (!data) {
    return <div className="p-8">Loading profile...</div>;
  }

  const { profile, contributions, totalDonated, activeCases } = data;

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Block */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-600">Assalamu Alaikum</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome, {profile.displayName}
            </h1>
            <p className="text-xs text-slate-400">
              Your donations are tracked transparently in coordinate boundaries for donor privacy.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/donor/map"
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <MapPin className="w-4 h-4" />
              Discover Cases Near You
            </Link>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-tr from-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-2 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            <div className="flex justify-between items-center text-emerald-400">
              <Coins className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Contributed</span>
            </div>
            <p className="text-3xl font-black">{totalDonated.toLocaleString()} EGP</p>
            <p className="text-xs text-emerald-200">Alhamdulillah! Direct support funds</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <Gift className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Transactions</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{contributions.length}</p>
            <p className="text-xs text-slate-500">Confirmed & pending donations</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Direct Impact</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {new Set(contributions.map((c) => c.beneficiaryProfileId)).size} Families
            </p>
            <p className="text-xs text-slate-500">Unique cases supported</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Cases Grid (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                <Heart className="text-rose-500 w-5 h-5" />
                Active Urgent Support Cases
              </h3>
              <Link
                href="/donor/map"
                className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
              >
                Browse Map
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeCases.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">All monthly support targets are fully covered!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {activeCases.map((b) => {
                  const remaining = Math.max(0, b.monthlySupportCap - b.monthlyReceivedAmount);
                  const progress = Math.min(
                    100,
                    Math.round((b.monthlyReceivedAmount / b.monthlySupportCap) * 100)
                  );

                  return (
                    <div
                      key={b.id}
                      className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px] font-bold text-slate-450">
                            {b.code}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                            Cat {b.category}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm">{b.displayName}</h4>
                        
                        <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                          {b.caseSummary}
                        </p>

                        <div className="space-y-1.5 pt-2 text-[10px] sm:text-xs">
                          <div className="flex justify-between text-slate-500 font-medium">
                            <span>Remaining Need:</span>
                            <span className="font-bold text-emerald-700">{remaining} EGP</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                        <Link
                          href={`/donor/beneficiary/${b.code}`}
                          className="py-2 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/donor/donate/${b.code}`}
                          className="py-2 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-50 transition-colors"
                        >
                          Support
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Donation History List (Right 5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 border-b border-slate-50 pb-3">
                <Gift className="text-emerald-600 w-5 h-5" />
                Your Contributions History
              </h3>

              {contributions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Coins className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-xs">You haven't made any donations yet.</p>
                  <p className="text-[10px]">Start by exploring verified local cases nearby.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {contributions.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 border border-slate-50 rounded-2xl bg-slate-50/50 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">
                          {c.beneficiaryProfile ? c.beneficiaryProfile.displayName : 'Unknown Case'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {c.beneficiaryProfile?.code}
                        </p>
                        <span className="inline-block text-[9px] font-semibold text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-800">+{c.amount} EGP</p>
                        <span className="text-[8px] font-bold uppercase text-slate-400 px-1 bg-slate-200/50 rounded">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
