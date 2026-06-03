import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { translations } from '@/lib/translations';
import {
  ShieldAlert,
  Users,
  Building,
  HeartHandshake,
  ShieldCheck,
  Coins,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Clock,
  Eye,
} from 'lucide-react';
import { BeneficiaryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getAdminMetrics() {
  const [
    totalBens,
    pendingBens,
    fullySupportedBens,
    totalDonors,
    totalCharities,
    pendingCharities,
    totalAuditLogs,
  ] = await Promise.all([
    prisma.beneficiaryProfile.count(),
    prisma.beneficiaryProfile.count({ where: { status: BeneficiaryStatus.PENDING_REVIEW } }),
    prisma.beneficiaryProfile.count({ where: { status: BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH } }),
    prisma.donorProfile.count(),
    prisma.charityProfile.count(),
    prisma.charityProfile.count({ where: { isApproved: false } }),
    prisma.auditLog.count(),
  ]);

  const contributions = await prisma.contribution.findMany({
    where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
    select: { amount: true },
  });

  const totalFunds = contributions.reduce((sum, c) => sum + c.amount, 0);

  const pendingList = await prisma.beneficiaryProfile.findMany({
    where: { status: BeneficiaryStatus.PENDING_REVIEW },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const recentAudits = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const allBens = await prisma.beneficiaryProfile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    totalBens,
    pendingBens,
    fullySupportedBens,
    totalDonors,
    totalCharities,
    pendingCharities,
    totalFunds,
    totalAuditLogs,
    pendingList,
    recentAudits,
    allBens,
  };
}

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const metrics = await getAdminMetrics();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Block */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-xl shadow-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]"></div>
          <div className={`space-y-1 relative z-10 ${isRtl ? 'sm:text-right' : ''}`}>
            <p className="text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              {t('systemAdmin')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('adminWelcome')}, {session.name}
            </h1>
            <p className="text-slate-400 text-xs">
              {t('adminTagline')}
            </p>
          </div>

          <div className="flex gap-2 relative z-10">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-bold uppercase rounded-full text-[10px] tracking-wider border border-emerald-500/20">
              {t('adminCore')}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <HeartHandshake className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('cases')}</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">{metrics.totalBens}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {metrics.pendingBens} {t('pendingVerification')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                <Coins className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('totalRaised')}</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">
                {metrics.totalFunds.toLocaleString()} {t('egp')}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{t('acrossCashResources')}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Building className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('charities')}</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">{metrics.totalCharities}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {metrics.pendingCharities} {t('pendingLicensing')}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
                <Users className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t('donors')}</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-900">{metrics.totalDonors}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('activeContributors')}</p>
            </div>
          </div>
        </div>

        {/* Pending Approval List and Audit Trail logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Pending Verification queue (Left 5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className={`flex justify-between items-center border-b border-slate-50 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <ShieldAlert className="text-amber-500 w-5 h-5" />
                  {t('approvalQueue')}
                </h3>
                <span className="text-xs px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-full font-bold border border-amber-100">
                  {metrics.pendingBens} {t('pending')}
                </span>
              </div>

              {metrics.pendingList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">{t('verificationQueueClear')}</p>
                  <p className="text-[10px] text-slate-400">{t('verificationQueueClearDesc')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.pendingList.map((p) => (
                    <div
                      key={p.id}
                      className={`p-4 border border-slate-50 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`space-y-0.5 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                        <p className="text-xs font-bold text-slate-800 truncate">{p.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                        <p className="text-[10px] text-slate-500">{p.areaName}</p>
                      </div>
                      <Link
                        href={`/admin/beneficiary/${p.code}/review`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors whitespace-nowrap shadow-sm shadow-emerald-100"
                      >
                        {t('auditCase')}
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit Trail Log viewer (Right 7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 border-b border-slate-50 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Clock className="text-emerald-600 w-5 h-5" />
              {t('recentAuditLog')}
            </h3>

            <div className="space-y-3.5">
              {metrics.recentAudits.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 border-b border-slate-50/50 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <span className="p-2 bg-slate-50 text-slate-400 rounded-lg shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div className={`space-y-0.5 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-1.5 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className="font-bold text-slate-800 truncate">
                        {log.user ? log.user.name : 'System Scheduler'}
                      </span>
                      {log.user && (
                        <span className="px-1 text-[8px] font-bold bg-slate-100 text-slate-500 rounded uppercase">
                          {log.user.role}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Beneficiary Management List */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className={`font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TrendingUp className="text-emerald-600 w-5 h-5" />
            {t('beneficiariesDirectory')}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b border-slate-100 text-slate-400 text-xs font-bold ${isRtl ? 'text-right' : ''}`}>
                  <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('code')}</th>
                  <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('displayName')}</th>
                  <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('legalName')}</th>
                  <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('category')}</th>
                  <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('targetCap')}</th>
                  <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                  <th className={`pb-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('details')}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.allBens.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-800 text-xs">{b.code}</td>
                    <td className="py-3 text-slate-700">{b.displayName}</td>
                    <td className="py-3 font-medium text-slate-800">{b.fullName}</td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{b.monthlySupportCap} {t('egp')}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === BeneficiaryStatus.APPROVED
                            ? 'bg-emerald-50 text-emerald-800'
                            : b.status === BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH
                            ? 'bg-teal-50 text-teal-800'
                            : b.status === BeneficiaryStatus.PENDING_REVIEW
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-800'
                        }`}
                      >
                        {b.status === BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH ? 'SUPPORTED' : b.status}
                      </span>
                    </td>
                    <td className={`py-3 ${isRtl ? 'text-left' : 'text-right'}`}>
                      <Link
                        href={`/admin/beneficiary/${b.code}`}
                        className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t('view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
