import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { translations } from '@/lib/LanguageContext';
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

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  const { profile, contributions, totalDonated, activeCases } = data;

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Block */}
        <div className={`bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-600">{t('welcome')}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('welcomeName')}, {profile.displayName}
            </h1>
            <p className="text-xs text-slate-400">
              {t('donorPrivacyNotice')}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/donor/map"
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <MapPin className="w-4 h-4" />
              {t('discoverCases')}
            </Link>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-tr from-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-2 relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            <div className={`flex justify-between items-center text-emerald-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Coins className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t('totalContributed')}</span>
            </div>
            <p className="text-3xl font-black">{totalDonated.toLocaleString()} {t('egp')}</p>
            <p className="text-xs text-emerald-250">{t('directSupportFunds')}</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
            <div className={`flex justify-between items-center text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Gift className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t('transactions')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{contributions.length}</p>
            <p className="text-xs text-slate-500 font-semibold">{t('confirmedPending')}</p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
            <div className={`flex justify-between items-center text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t('directImpact')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {new Set(contributions.map((c) => c.beneficiaryProfileId)).size} {t('familiesSupported')}
            </p>
            <p className="text-xs text-slate-500 font-semibold">{t('uniqueCasesSupported')}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Cases Grid (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`flex justify-between items-center border-b border-slate-100 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Heart className="text-rose-500 w-5 h-5" />
                {t('activeUrgentCases')}
              </h3>
              <Link
                href="/donor/map"
                className={`text-xs text-emerald-600 font-bold hover:underline flex items-center gap-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {t('browseMap')}
                <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {activeCases.length === 0 ? (
              <p className="text-xs text-slate-450 py-12 text-center">{t('allTargetsCovered')}</p>
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
                        <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {b.code}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                            {t('category')} {b.category}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm">{b.displayName}</h4>
                        
                        <p className="text-[11px] text-slate-550 leading-normal line-clamp-2">
                          {b.caseSummary}
                        </p>

                        <div className="space-y-1.5 pt-2 text-[10px] sm:text-xs">
                          <div className={`flex justify-between text-slate-500 font-medium ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span>{t('remainingNeed')}:</span>
                            <span className="font-bold text-emerald-700">{remaining} {t('egp')}</span>
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
                          {t('viewDetails')}
                        </Link>
                        <Link
                          href={`/donor/donate/${b.code}`}
                          className="py-2 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-50 transition-colors"
                        >
                          {t('support')}
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
              <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 border-b border-slate-50 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Gift className="text-emerald-600 w-5 h-5" />
                {t('contributionsHistory')}
              </h3>

              {contributions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Coins className="w-10 h-10 text-slate-200 mx-auto" />
                  <p className="text-xs">{t('noDonationsYet')}</p>
                  <p className="text-[10px]">{t('startExploring')}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {contributions.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 border border-slate-50 rounded-2xl bg-slate-50/50 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">
                          {c.beneficiaryProfile ? c.beneficiaryProfile.displayName : 'Unknown Case'}
                        </p>
                        <p className="text-[10px] text-slate-450 font-mono">
                          {c.beneficiaryProfile?.code}
                        </p>
                        <span className="inline-block text-[9px] font-semibold text-slate-450">
                          {new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                      <div className={isRtl ? 'text-left' : 'text-right'}>
                        <p className="font-bold text-emerald-800">+{c.amount} {t('egp')}</p>
                        <span className="text-[8px] font-bold uppercase text-slate-450 px-1 bg-slate-200/50 rounded">
                          {t(c.status.toLowerCase() as any)}
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
