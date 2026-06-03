import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { translations } from '@/lib/translations';
import { Building, Coins, TrendingUp, Users, Heart, ArrowRight } from 'lucide-react';
import { BeneficiaryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function CharityDashboard() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'CHARITY_ADMIN') redirect('/');

  const charity = await prisma.charityProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!charity) return <div className="p-8 text-center">Profile not found.</div>;

  const contributions = await prisma.contribution.findMany({
    where: { charityProfileId: charity.id, status: { in: ['CONFIRMED', 'DELIVERED'] } },
    include: { beneficiaryProfile: { select: { code: true, displayName: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const totalDonated = contributions.reduce((sum, c) => sum + c.amount, 0);

  const activeCases = await prisma.beneficiaryProfile.findMany({
    where: { status: BeneficiaryStatus.APPROVED },
    orderBy: { evaluationScore: 'desc' },
    take: 6,
  });

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className={`bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-600">{t('charityPortal')}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{charity.charityName}</h1>
            <p className="text-xs text-slate-400">
              {t('licensePrefix')}: {charity.licenseNumber} · {charity.isApproved ? t('approved') : t('pendingApproval')}
            </p>
          </div>
          <Link href="/charity/search" className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
            <Users className="w-4 h-4" /> {t('searchBeneficiaries')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-tr from-emerald-900 to-slate-900 text-white p-6 rounded-3xl shadow-md space-y-2 relative overflow-hidden">
            <div className={`flex justify-between items-center text-emerald-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Coins className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase">{t('totalContributedCharity')}</span>
            </div>
            <p className="text-3xl font-black">{totalDonated.toLocaleString()} {t('egp')}</p>
          </div>
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
            <div className={`flex justify-between items-center text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase">{t('transactionsLabel')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{contributions.length}</p>
          </div>
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-2">
            <div className={`flex justify-between items-center text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Heart className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase">{t('familiesReached')}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{new Set(contributions.map(c => c.beneficiaryProfileId)).size}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className={`font-bold text-slate-800 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Heart className="text-rose-500 w-5 h-5" /> {t('activeCasesNeedingSupport')}
            </h3>
            {activeCases.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">{t('allCasesFullySupported')}</p>
            ) : (
              <div className="space-y-3">
                {activeCases.map(b => {
                  const remaining = Math.max(0, b.monthlySupportCap - b.monthlyReceivedAmount);
                  return (
                    <div key={b.id} className={`p-4 border border-slate-50 rounded-2xl bg-slate-50/50 flex justify-between items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`space-y-0.5 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                        <p className="text-xs font-bold text-slate-800 truncate">{b.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{b.code} · Cat {b.category}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{t('remaining')}: {remaining} {t('egp')}</p>
                      </div>
                      <Link href={`/donor/beneficiary/${b.code}`} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 whitespace-nowrap shadow-sm">
                        {t('view')} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className={`font-bold text-slate-800 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Coins className="text-emerald-600 w-5 h-5" /> {t('contributionHistory')}
            </h3>
            {contributions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">{t('noContributions')}</p>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {contributions.map(c => (
                  <div key={c.id} className={`p-3.5 border border-slate-50 rounded-2xl bg-slate-50/50 flex justify-between items-center text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={isRtl ? 'text-right' : ''}>
                      <p className="font-bold text-slate-800">{c.beneficiaryProfile?.displayName || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.beneficiaryProfile?.code}</p>
                    </div>
                    <div className={isRtl ? 'text-left' : 'text-right'}>
                      <p className="font-bold text-emerald-800">+{c.amount} {t('egp')}</p>
                      <span className="text-[8px] font-bold uppercase text-slate-400">{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
