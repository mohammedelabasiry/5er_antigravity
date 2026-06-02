import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getReceivedThisMonth } from '@/lib/capLogic';
import { cookies } from 'next/headers';
import { translations } from '@/lib/LanguageContext';
import {
  Heart,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Package,
  Bell,
  Clock,
} from 'lucide-react';
import { BeneficiaryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getBeneficiaryData(userId: string) {
  const profile = await prisma.beneficiaryProfile.findUnique({
    where: { userId },
    include: {
      documents: true,
      evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!profile) return null;

  const receivedThisMonth = await getReceivedThisMonth(profile.id);

  const contributions = await prisma.contribution.findMany({
    where: { beneficiaryProfileId: profile.id },
    include: {
      donorProfile: { select: { displayName: true } },
      charityProfile: { select: { charityName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const resourceDeliveries = await prisma.resourceDistribution.findMany({
    where: { beneficiaryProfileId: profile.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    profile,
    receivedThisMonth,
    contributions,
    resourceDeliveries,
    notifications,
  };
}

export default async function BeneficiaryDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'BENEFICIARY') {
    redirect('/');
  }

  const data = await getBeneficiaryData(session.userId);

  if (!data) {
    redirect('/beneficiary/onboarding');
  }

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  const { profile, receivedThisMonth, contributions, resourceDeliveries, notifications } = data;
  const remainingNeed = Math.max(0, profile.monthlySupportCap - receivedThisMonth);
  const percentMet = Math.min(100, Math.round((receivedThisMonth / profile.monthlySupportCap) * 100));

  const getStatusBadgeClass = (status: BeneficiaryStatus) => {
    switch (status) {
      case BeneficiaryStatus.APPROVED:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH:
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case BeneficiaryStatus.PENDING_REVIEW:
        return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
      case BeneficiaryStatus.REJECTED:
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case BeneficiaryStatus.BLOCKED:
        return 'bg-slate-900 text-white border-slate-950';
      default:
        return 'bg-slate-55 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status: BeneficiaryStatus) => {
    if (status === BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH) return lang === 'ar' ? 'مكتمل الدعم هذا الشهر' : 'Fully Supported This Month';
    if (status === BeneficiaryStatus.PENDING_REVIEW) return lang === 'ar' ? 'قيد التدقيق والمراجعة' : 'Under Review';
    if (status === BeneficiaryStatus.APPROVED) return lang === 'ar' ? 'مقبول / نشط' : 'Approved';
    if (status === BeneficiaryStatus.REJECTED) return lang === 'ar' ? 'مرفوض' : 'Rejected';
    if (status === BeneficiaryStatus.BLOCKED) return lang === 'ar' ? 'محظور' : 'Blocked';
    return status;
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <div className={`bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-600">{t('welcomeBack')}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {profile.displayName}
            </h1>
            <p className="text-xs text-slate-400 font-mono">{t('caseId')}: {profile.code}</p>
          </div>

          <div className={`flex flex-wrap items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeClass(
                profile.status
              )}`}
            >
              {getStatusLabel(profile.status)}
            </span>
            <Link
              href="/chat"
              className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-100"
            >
              <MessageSquare className="w-4 h-4" />
              {t('chatRoom')}
            </Link>
          </div>
        </div>

        {/* Audit Status Notice Banners */}
        {profile.status === BeneficiaryStatus.PENDING_REVIEW && (
          <div className={`p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl flex items-start gap-3 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">{t('pendingAuditTitle')}</h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                {t('pendingAuditDesc')}
              </p>
            </div>
          </div>
        )}

        {profile.status === BeneficiaryStatus.REJECTED && (
          <div className={`p-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl flex items-start gap-3 shadow-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">{t('rejectedTitle')}</h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                {t('rejectedDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Progress and Need Assessment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Monthly Cap Progress Card */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="text-emerald-600 w-5 h-5" />
                  {t('monthlySupportTracker')}
                </h3>
                <span className={`text-xs text-slate-450 font-semibold flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {t('currentMonth')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2 pt-4">
                <div className={`flex justify-between text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-slate-500 font-medium">{t('progressToTarget')}</span>
                  <span className="font-bold text-emerald-700">{percentMet}% {t('percentMet')}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentMet}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-3 gap-4 border-t border-slate-50 pt-6 mt-6 ${isRtl ? 'text-right' : ''}`}>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t('monthlyCapTarget')}</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{profile.monthlySupportCap} {t('egp')}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t('receivedAid')}</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">+{receivedThisMonth} {t('egp')}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{t('remainingNeeded')}</p>
                <p className="text-lg sm:text-xl font-bold text-teal-600 mt-0.5">{remainingNeed} {t('egp')}</p>
              </div>
            </div>
          </div>

          {/* Poverty Score & Factor evaluation */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ShieldCheck className="text-emerald-600 w-5 h-5" />
              {t('socioEconomicScore')}
            </h3>
            
            <div className={`flex items-center gap-4 py-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center font-bold text-xl shrink-0">
                {profile.evaluationScore}
              </div>
              <div>
                <p className="text-xs text-slate-400">{t('assignedBracket')}</p>
                <p className="font-bold text-slate-800 text-lg">{t('category')} {profile.category}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {profile.category === 'A'
                    ? t('extremelyVulnerable')
                    : profile.category === 'B'
                    ? t('veryNeedy')
                    : profile.category === 'C'
                    ? t('needy')
                    : t('limitedSupport')}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 space-y-2 text-xs">
              <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-slate-400">{t('familyMembers')}:</span>
                <span className="font-semibold text-slate-700">{profile.familyMembersCount}</span>
              </div>
              <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-slate-400">{t('childrenUnder18')}:</span>
                <span className="font-semibold text-slate-700">{profile.childrenCount}</span>
              </div>
              <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-slate-400">{t('employmentStatus')}:</span>
                <span className="font-semibold text-slate-700">{profile.employmentStatus}</span>
              </div>
              <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-slate-400">{t('rentBurden')}:</span>
                <span className="font-semibold text-slate-700">{profile.housingStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tables: Contributions & Deliveries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Donations Received */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <DollarSign className="text-emerald-600 w-5 h-5" />
              {t('contributionsLedger')}
            </h3>

            {contributions.length === 0 ? (
              <p className="text-xs text-slate-450 py-6 text-center">{t('noContributionsYet')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b border-slate-50 text-slate-400 text-xs font-bold ${isRtl ? 'text-right' : 'text-left'}`}>
                      <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('source')}</th>
                      <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('amount')}</th>
                      <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                      <th className={`pb-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50/50 hover:bg-slate-50/30">
                        <td className="py-3.5 font-medium text-slate-700">
                          {c.charityProfile
                            ? c.charityProfile.charityName
                            : c.donorProfile
                            ? c.donorProfile.displayName
                            : t('anonymous')}
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">{c.amount} {t('egp')}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.status === 'CONFIRMED' || c.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : c.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {t(c.status.toLowerCase() as any)}
                          </span>
                        </td>
                        <td className={`py-3.5 text-xs text-slate-400 ${isRtl ? 'text-left' : 'text-right'}`}>
                          {new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Physical Resource Distributions */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Package className="text-teal-600 w-5 h-5" />
              {t('resourceDistributions')}
            </h3>

            {resourceDeliveries.length === 0 ? (
              <p className="text-xs text-slate-450 py-6 text-center">{t('noResourcesYet')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b border-slate-50 text-slate-400 text-xs font-bold ${isRtl ? 'text-right' : 'text-left'}`}>
                      <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('itemType')}</th>
                      <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('qty')}</th>
                      <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                      <th className={`pb-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourceDeliveries.map((rd) => (
                      <tr key={rd.id} className="border-b border-slate-50/50 hover:bg-slate-50/30">
                        <td className="py-3.5 font-medium text-slate-700">{rd.resourceType}</td>
                        <td className="py-3.5 text-slate-600">{rd.quantity} {t('qty')}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              rd.deliveryStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : rd.deliveryStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-800 animate-pulse'
                                : rd.deliveryStatus === 'EN_ROUTE'
                                ? 'bg-sky-50 text-sky-800'
                                : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {t(rd.deliveryStatus.toLowerCase() as any)}
                          </span>
                        </td>
                        <td className={`py-3.5 text-xs text-slate-400 ${isRtl ? 'text-left' : 'text-right'}`}>
                          {new Date(rd.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Notifications and Alerts box */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Bell className="text-emerald-600 w-5 h-5" />
            {t('notifications')}
          </h3>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-450 py-4 text-center">{t('noNotifications')}</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 border border-slate-55 rounded-xl bg-slate-50/50 flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 leading-normal">{n.message}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
