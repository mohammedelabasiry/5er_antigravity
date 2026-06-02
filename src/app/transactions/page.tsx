import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { translations } from '@/lib/LanguageContext';
import { 
  ArrowLeft, 
  Coins, 
  Gift, 
  Calendar, 
  User, 
  Building2, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Role, ContributionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getTransactions(session: { userId: string; role: string }) {
  const { userId, role } = session;

  const includeConfig = {
    beneficiaryProfile: { select: { code: true, displayName: true } },
    donorProfile: { select: { displayName: true } },
    charityProfile: { select: { charityName: true } },
  };

  if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
    return await prisma.contribution.findMany({
      include: includeConfig,
      orderBy: { createdAt: 'desc' },
    });
  }

  if (role === Role.BENEFICIARY) {
    const beneficiary = await prisma.beneficiaryProfile.findUnique({
      where: { userId },
    });
    if (!beneficiary) return [];
    
    const contribs = await prisma.contribution.findMany({
      where: { beneficiaryProfileId: beneficiary.id },
      include: includeConfig,
      orderBy: { createdAt: 'desc' },
    });

    return contribs.map((c) => ({
      ...c,
      donorProfile: c.donorProfile ? { displayName: 'Anonymous Supporter' } : null,
    }));
  }

  if (role === Role.DONOR) {
    const donor = await prisma.donorProfile.findUnique({
      where: { userId },
    });
    if (!donor) return [];

    return await prisma.contribution.findMany({
      where: { donorProfileId: donor.id },
      include: includeConfig,
      orderBy: { createdAt: 'desc' },
    });
  }

  if (role === Role.CHARITY_ADMIN) {
    const charity = await prisma.charityProfile.findUnique({
      where: { userId },
    });
    if (!charity) return [];

    return await prisma.contribution.findMany({
      where: { charityProfileId: charity.id },
      include: includeConfig,
      orderBy: { createdAt: 'desc' },
    });
  }

  return [];
}

export default async function TransactionsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const transactions = await getTransactions(session);

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  const getStatusBadge = (status: ContributionStatus) => {
    switch (status) {
      case ContributionStatus.DELIVERED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('delivered')}
          </span>
        );
      case ContributionStatus.CONFIRMED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مؤكد' : 'Confirmed'}
          </span>
        );
      case ContributionStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            {t('pending')}
          </span>
        );
      case ContributionStatus.CANCELLED:
      case ContributionStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            {lang === 'ar' ? (status === 'CANCELLED' ? 'ملغي' : 'مرفوض') : status}
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">{status}</span>;
    }
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('ledgerTitle')}</h1>
            <p className="text-xs text-slate-400">
              {t('ledgerSubtitle')}
            </p>
          </div>
        </div>

        {/* Audit Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalRegistry')}</span>
            <p className="text-3xl font-extrabold text-slate-800">{transactions.length}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'ar' ? 'تسجيلات الحوكمة النشطة' : 'Recorded aid activities'}
            </p>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalTransactedValue')}</span>
            <p className="text-3xl font-extrabold text-emerald-700">
              {transactions
                .filter((t) => t.status === 'CONFIRMED' || t.status === 'DELIVERED')
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}{' '}
              {t('egp')}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'ar' ? 'تم تأكيدها أو تسليمها بنجاح' : 'Successfully delivered/confirmed'}
            </p>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">{t('pendingGovernance')}</span>
            <p className="text-3xl font-extrabold text-amber-600">
              {transactions.filter((t) => t.status === 'PENDING').length}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'ar' ? 'بانتظار التحقق والموافقة' : 'Awaiting audit or verification'}
            </p>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-20 text-slate-400 space-y-2">
              <Coins className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="font-bold text-slate-650">
                {lang === 'ar' ? 'لا توجد معاملات مسجلة' : 'No transactions recorded'}
              </p>
              <p className="text-xs">
                {lang === 'ar' ? 'لم يتم معالجة أي توزيع مساعدات بعد.' : 'No aid distributions have been processed yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-700 text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-450 uppercase font-bold text-[9px] tracking-wider">
                  <tr className={isRtl ? 'text-right' : 'text-left'}>
                    <th className={`px-6 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('refReferenceId')}</th>
                    <th className={`px-6 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('date')}</th>
                    <th className={`px-6 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('refBeneficiary')}</th>
                    <th className={`px-6 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('refSourceContributor')}</th>
                    <th className={`px-6 py-4 ${isRtl ? 'text-right' : 'text-left'}`}>{t('refTypeParticulars')}</th>
                    <th className={`px-6 py-4 ${isRtl ? 'text-left' : 'text-right'}`}>{t('refValueEgp')}</th>
                    <th className="px-6 py-4 text-center">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((trans) => {
                    let contributor = t('anonymous');
                    if (trans.donorProfile) {
                      contributor = trans.donorProfile.displayName || (lang === 'ar' ? 'متبرع فاعل خير' : 'Anonymous Donor');
                    } else if (trans.charityProfile) {
                      contributor = trans.charityProfile.charityName;
                    } else if (trans.createdById) {
                      contributor = lang === 'ar' ? 'سجل إداري' : 'Admin Record';
                    }

                    return (
                      <tr key={trans.id} className="hover:bg-slate-50/30 transition-colors">
                        {/* Reference */}
                        <td className="px-6 py-4 font-mono font-bold text-slate-400 text-[10px] whitespace-nowrap">
                          {trans.id.slice(0, 8).toUpperCase()}...
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                          {new Date(trans.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Beneficiary */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-slate-400 text-[9px] block">
                              {trans.beneficiaryProfile.code}
                            </span>
                            <span className="font-bold text-slate-800">
                              {trans.beneficiaryProfile.displayName}
                            </span>
                          </div>
                        </td>

                        {/* Contributor */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            {trans.donorProfile ? (
                              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                            {contributor}
                          </span>
                        </td>

                        {/* Type & Particulars */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              {trans.type === 'CASH' ? (
                                <>
                                  <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  {lang === 'ar' ? 'نقدي' : 'CASH'}
                                </>
                              ) : (
                                <>
                                  <Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  {lang === 'ar' ? 'عيني' : 'RESOURCE'}
                                </>
                              )}
                            </span>
                            {trans.type === 'RESOURCE' && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {trans.resourceType} ({trans.resourceQuantity} {t('qty')})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Value */}
                        <td className={`px-6 py-4 font-bold text-slate-900 whitespace-nowrap ${isRtl ? 'text-left' : 'text-right'}`}>
                          {trans.amount.toLocaleString()} {t('egp')}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getStatusBadge(trans.status)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
