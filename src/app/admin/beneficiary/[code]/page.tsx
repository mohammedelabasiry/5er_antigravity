import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { translations } from '@/lib/translations';
import {
  ArrowLeft,
  FileText,
  User,
  Activity,
  DollarSign,
  Package,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  Edit3,
} from 'lucide-react';
import { BeneficiaryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

async function getBeneficiaryDetailsData(code: string) {
  const profile = await prisma.beneficiaryProfile.findUnique({
    where: { code },
    include: {
      user: { select: { email: true } },
      documents: true,
      adminNotes: { orderBy: { createdAt: 'desc' } },
      contributions: {
        include: {
          donorProfile: { select: { displayName: true } },
          charityProfile: { select: { charityName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      resourceDistributions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return profile;
}

export default async function BeneficiaryDetailsPage(
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const profile = await getBeneficiaryDetailsData(params.code);

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  if (!profile) {
    return (
      <div className="flex-1 p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-bold text-slate-800">{t('profileNotFound')}</h2>
          <Link href="/admin/dashboard" className="text-emerald-600 font-bold hover:underline">
            {t('backToAdminDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: BeneficiaryStatus) => {
    switch (status) {
      case BeneficiaryStatus.APPROVED:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH:
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case BeneficiaryStatus.PENDING_REVIEW:
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case BeneficiaryStatus.REJECTED:
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case BeneficiaryStatus.BLOCKED:
        return 'bg-slate-900 text-white border-slate-950';
      default:
        return 'bg-slate-50 text-slate-650 border-slate-200';
    }
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          href="/admin/dashboard"
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          {t('backToAdminDashboard')}
        </Link>

        {/* Header Summary */}
        <div className={`bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
          <div className={isRtl ? 'text-right' : ''}>
            <div className={`flex items-center gap-2 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(
                  profile.status
                )}`}
              >
                {profile.status}
              </span>
              {profile.isEligibleOverride && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                  {t('overrideActive')}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-2">
              {profile.fullName}
            </h1>
            <p className="text-xs text-slate-400 font-mono">{t('caseCode')}: {profile.code}</p>
          </div>

          <Link
            href={`/admin/beneficiary/${profile.code}/review`}
            className={`px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <Edit3 className="w-4 h-4" />
            {t('modifyCaseParameters')}
          </Link>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Details Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Case Summary */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Activity className="text-emerald-600 w-4 h-4" />
                {t('caseSummaryPublic')}
              </h3>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-2 ${isRtl ? 'text-right' : ''}`}>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('displayNameLabel')}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{profile.displayName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('generalNeighborhood')}</p>
                  <p className="font-semibold text-slate-750 mt-0.5">{profile.areaName}</p>
                </div>
              </div>
              <div className={isRtl ? 'text-right' : ''}>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{t('caseStory')}</p>
                <p className="text-xs text-slate-650 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                  {profile.caseSummary}
                </p>
              </div>
            </div>

            {/* Private Details */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <User className="text-emerald-600 w-4 h-4" />
                {t('confidentialProfile')}
              </h3>

              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs ${isRtl ? 'text-right' : ''}`}>
                <div>
                  <p className="text-[10px] text-slate-400">{t('legalName')}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">{t('nationalId')}</p>
                  <p className="font-semibold font-mono text-slate-850 mt-0.5">{profile.nationalId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">{t('phone')}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">{t('email')}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.user.email}</p>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-[10px] text-slate-400">{t('exactAddress')}</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.address}</p>
                </div>
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <DollarSign className="text-emerald-600 w-4 h-4" />
                {t('contributionsLedgerAdmin')}
              </h3>

              {profile.contributions.length === 0 ? (
                <p className="text-xs text-slate-405 py-4 text-center">{t('noContributionsCase')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b border-slate-50 text-slate-400 font-bold ${isRtl ? 'text-right' : 'text-left'}`}>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('contributor')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('amount')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('type')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.contributions.map((c) => (
                        <tr key={c.id} className="border-b border-slate-50/50">
                          <td className="py-3 font-semibold text-slate-700">
                            {c.charityProfile
                              ? c.charityProfile.charityName
                              : c.donorProfile
                              ? c.donorProfile.displayName
                              : (lang === 'ar' ? 'إدخال إداري' : 'Admin Entry')}
                          </td>
                          <td className="py-3 font-bold text-slate-900">{c.amount} {t('egp')}</td>
                          <td className="py-3 text-slate-500">{c.type}</td>
                          <td className="py-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                c.status === 'CONFIRMED' || c.status === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : c.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className={`py-3 text-slate-400 ${isRtl ? 'text-left' : 'text-right'}`}>
                            {new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Resource Deliveries */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Package className="text-teal-600 w-4 h-4" />
                {t('physicalResourceDists')}
              </h3>

              {profile.resourceDistributions.length === 0 ? (
                <p className="text-xs text-slate-405 py-4 text-center">{t('noDistributions')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`border-b border-slate-50 text-slate-400 font-bold ${isRtl ? 'text-right' : 'text-left'}`}>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('resourceItem')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('quantity')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('estimatedValue')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('deliveryStatusLabel')}</th>
                        <th className={`pb-3 ${isRtl ? 'text-left' : 'text-right'}`}>{t('date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.resourceDistributions.map((rd) => (
                        <tr key={rd.id} className="border-b border-slate-50/50">
                          <td className="py-3 font-semibold text-slate-700">{rd.resourceType}</td>
                          <td className="py-3 text-slate-600">{rd.quantity} {lang === 'ar' ? 'وحدة' : 'units'}</td>
                          <td className="py-3 font-bold text-slate-900">{rd.estimatedValue} {t('egp')}</td>
                          <td className="py-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                rd.deliveryStatus === 'DELIVERED'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : rd.deliveryStatus === 'PENDING'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {rd.deliveryStatus}
                            </span>
                          </td>
                          <td className={`py-3 text-slate-400 ${isRtl ? 'text-left' : 'text-right'}`}>
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

          {/* Sidebar Stats Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Monthly cap card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <TrendingUp className="text-emerald-600 w-4 h-4" />
                {t('monthlySupportCycle')}
              </h3>

              <div className="space-y-3">
                <div className={`flex justify-between text-xs font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-slate-400">{t('supportProgress')}</span>
                  <span className="text-emerald-700">
                    {profile.monthlyReceivedAmount} / {profile.monthlySupportCap} {t('egp')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (profile.monthlyReceivedAmount / profile.monthlySupportCap) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Admin Audit notes history */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <MessageSquare className="text-slate-500 w-4 h-4" />
                {t('auditLogsComments')}
              </h3>
              {profile.adminNotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">{t('noNotesLogged')}</p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {profile.adminNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-50 border border-slate-105 rounded-xl text-xs">
                      <p className={`text-slate-650 leading-relaxed font-semibold ${isRtl ? 'text-right' : ''}`}>{note.content}</p>
                      <p className={`text-[10px] text-slate-400 mt-1 ${isRtl ? 'text-right' : ''}`}>
                        {new Date(note.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
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
