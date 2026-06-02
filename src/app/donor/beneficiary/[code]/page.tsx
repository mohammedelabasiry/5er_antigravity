import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReceivedThisMonth } from '@/lib/capLogic';
import { translations } from '@/lib/LanguageContext';
import {
  ArrowLeft,
  MapPin,
  Heart,
  TrendingUp,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import ChatButton from './ChatButton';

export const dynamic = 'force-dynamic';

async function getBeneficiaryData(code: string) {
  const profile = await prisma.beneficiaryProfile.findUnique({
    where: { code },
  });

  if (!profile) return null;

  // Only allow viewing if approved or fully supported
  if (profile.status !== 'APPROVED' && profile.status !== 'FULLY_SUPPORTED_THIS_MONTH') {
    return null;
  }

  const received = await getReceivedThisMonth(profile.id);

  return { profile, received };
}

export default async function BeneficiaryProfilePage(
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const data = await getBeneficiaryData(params.code);

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  if (!data) {
    return (
      <div className="flex-1 p-8 text-center flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto space-y-4">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">{t('caseNotFound')}</h2>
          <p className="text-slate-500 text-xs">
            {t('caseNotFoundDesc')}
          </p>
          <Link
            href={session.role === 'DONOR' ? '/donor/dashboard' : '/charity/dashboard'}
            className="text-emerald-600 font-bold hover:underline inline-block mt-2"
          >
            {t('backToDashboardLink')}
          </Link>
        </div>
      </div>
    );
  }

  const { profile, received } = data;
  const remaining = Math.max(0, profile.monthlySupportCap - received);
  const percentMet = Math.min(100, Math.round((received / profile.monthlySupportCap) * 100));

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          href={session.role === 'DONOR' ? '/donor/dashboard' : '/charity/dashboard'}
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          {t('backToDashboardLink')}
        </Link>

        {/* Profile Card */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-6 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
            <div className="space-y-1">
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="font-mono text-xs font-bold text-slate-400">{profile.code}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                  {t('categoryLabel')} {profile.category}
                </span>
                {profile.status === 'FULLY_SUPPORTED_THIS_MONTH' && (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded">
                    {t('fullyCovered')}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {profile.displayName}
              </h2>
              <p className={`text-xs text-slate-500 flex items-center gap-1 font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4 text-emerald-600" />
                {profile.areaName} {t('approxLocation')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {t('verifiedProfile')}
              </span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="space-y-4">
            <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className="text-emerald-600 w-4 h-4" />
              {t('monthlyTrackerTitle')}
            </h3>

            <div className="space-y-2">
              <div className={`flex justify-between text-xs sm:text-sm font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-slate-450">{t('receivedAid')}: {received.toLocaleString()} {t('egp')}</span>
                <span className="text-emerald-700">{percentMet}% {t('percentMet')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentMet}%` }}
                ></div>
              </div>
            </div>

            <div className={`grid grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs mt-3 ${isRtl ? 'text-right' : ''}`}>
              <div>
                <p className="text-slate-400">{t('monthlyTargetCap')}</p>
                <p className="font-bold text-slate-900 text-sm sm:text-base mt-0.5">
                  {profile.monthlySupportCap.toLocaleString()} {t('egp')}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t('receivedSoFar')}</p>
                <p className="font-bold text-emerald-700 text-sm sm:text-base mt-0.5">
                  {received.toLocaleString()} {t('egp')}
                </p>
              </div>
              <div>
                <p className="text-slate-400">{t('remainingGap')}</p>
                <p className="font-bold text-teal-600 text-sm sm:text-base mt-0.5">
                  {remaining.toLocaleString()} {t('egp')}
                </p>
              </div>
            </div>
          </div>

          {/* Story Case Description */}
          <div className="space-y-3 pt-2">
            <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Heart className="text-rose-500 w-4 h-4" />
              {t('caseBackground')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-650 bg-slate-50/30 p-4 rounded-3xl border border-slate-100 leading-relaxed">
              {profile.caseSummary}
            </p>
          </div>

          {/* Call to Actions */}
          <div className={`flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-50 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {profile.status === 'FULLY_SUPPORTED_THIS_MONTH' ? (
              <div className="flex-1 p-3 bg-teal-50 border border-teal-150 text-teal-800 text-xs font-semibold rounded-xl text-center">
                {t('fullyFundedThisMonth')}
              </div>
            ) : (
              <Link
                href={
                  session.role === 'DONOR'
                    ? `/donor/donate/${profile.code}`
                    : `/charity/dashboard?donate=${profile.code}`
                }
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-50 transition-all transform hover:-translate-y-0.5 duration-300"
              >
                <Coins className="w-4 h-4" />
                {t('contributeSupportFunds')}
              </Link>
            )}

            <ChatButton beneficiaryProfileId={profile.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
