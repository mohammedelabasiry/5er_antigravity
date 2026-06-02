'use client';

import Link from 'next/link';
import { HeartHandshake, ShieldCheck, MapPin, BarChart3, Fingerprint, Coins, Award, BarChart } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

interface LandingHeroProps {
  stats: {
    totalBeneficiaries: number;
    fullySupported: number;
    totalDonated: number;
    totalCharities: number;
  };
  session: {
    role: string;
    name: string;
    email: string;
  } | null;
}

export default function LandingHero({ stats, session }: LandingHeroProps) {
  const { t, language, isRtl } = useTranslation();

  const dashboardLink =
    !session
      ? '/register'
      : session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
      ? '/admin/dashboard'
      : session.role === 'CHARITY_ADMIN'
      ? '/charity/dashboard'
      : session.role === 'DONOR'
      ? '/donor/dashboard'
      : '/beneficiary/dashboard';

  return (
    <div className={`flex-1 bg-gradient-to-b from-emerald-50/20 via-white to-slate-50 ${isRtl ? 'font-arabic' : ''}`}>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className={`lg:col-span-7 space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-100 animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'ar' ? 'منصة حوكمة الصدقة من الجيل القادم' : 'Next-Gen Charity Governance'}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-none">
                {language === 'ar' ? (
                  <>
                    صدقتك، بكل <br />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      شفافية وكرامة
                    </span>
                  </>
                ) : (
                  <>
                    Sadaqah, Managed with <br />
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                      Dignity and Transparency
                    </span>
                  </>
                )}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl">
                {t('heroSubtitle')}
              </p>

              <div className={`flex flex-wrap gap-4 pt-2 ${isRtl ? 'justify-end' : ''}`}>
                <Link
                  href={dashboardLink}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  {session
                    ? language === 'ar' ? 'اذهب إلى لوحتك' : 'Go to Your Dashboard'
                    : t('getStarted')}
                </Link>
                {!session && (
                  <Link
                    href="/login"
                    className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm"
                  >
                    {t('navLogin')}
                  </Link>
                )}
              </div>
            </div>

            {/* Live Stats Card */}
            <div className="mt-16 lg:mt-0 lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
                <div className={`absolute top-0 ${isRtl ? 'left-0 rounded-br-3xl rounded-tl-3xl' : 'right-0 rounded-bl-3xl rounded-tr-3xl'} p-4 bg-emerald-500 text-white font-semibold text-xs tracking-wider uppercase`}>
                  {language === 'ar' ? 'مدقق لحظياً' : 'Audited Live'}
                </div>

                <h3 className={`text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <BarChart className="text-emerald-600 w-5 h-5" />
                  {language === 'ar' ? 'سجل التأثير الشهري' : 'Monthly Impact Ledger'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`bg-slate-50/50 p-4 rounded-2xl border border-slate-100 ${isRtl ? 'text-right' : ''}`}>
                    <p className="text-xs text-slate-400 font-medium">{language === 'ar' ? 'إجمالي المساعدات' : 'Total Aid Raised'}</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.totalDonated.toLocaleString()} {t('egp')}</p>
                  </div>
                  <div className={`bg-slate-50/50 p-4 rounded-2xl border border-slate-100 ${isRtl ? 'text-right' : ''}`}>
                    <p className="text-xs text-slate-400 font-medium">{language === 'ar' ? 'الحالات الموثقة' : 'Verified Cases'}</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.totalBeneficiaries}</p>
                  </div>
                  <div className={`bg-slate-50/50 p-4 rounded-2xl border border-slate-100 col-span-2 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={isRtl ? 'text-right' : ''}>
                      <p className="text-xs text-slate-400 font-medium">{language === 'ar' ? 'وصل للحد الأقصى' : 'Fully Supported (Cap Met)'}</p>
                      <p className="text-lg font-bold text-emerald-700 mt-0.5">
                        {stats.totalBeneficiaries > 0 ? Math.round((stats.fullySupported / stats.totalBeneficiaries) * 100) : 0}% {language === 'ar' ? 'من الحالات' : 'Cases'}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 flex items-center justify-center font-bold text-xs text-slate-700">
                      {stats.fullySupported}/{stats.totalBeneficiaries}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className={`flex items-center justify-between text-xs font-semibold text-slate-500 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100/50 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className={`flex items-center gap-1.5 text-emerald-800 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <Award className="w-4 h-4 text-emerald-600" />
                      {language === 'ar' ? 'الجمعيات النشطة' : 'Active Charities'}
                    </span>
                    <span>{stats.totalCharities} {language === 'ar' ? 'مسجلة' : 'Registered'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governance Values Section */}
      <section className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {language === 'ar' ? 'معيار أعلى في حوكمة الخير' : 'A Higher Standard of Governance'}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              {language === 'ar'
                ? 'تؤدي الأساليب التقليدية في الخير إلى فجوات في التنسيق وتكرار في الدعم. إليك كيف تضع خير لينك إطاراً شفافاً:'
                : 'Conventional charity methods can lead to coordination gaps and support duplication. Here is how KhairLink establishes a transparent framework:'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: <Fingerprint className="w-6 h-6" />,
                titleEn: 'Privacy & Dignity First',
                titleAr: 'الخصوصية والكرامة أولاً',
                descEn: 'We never expose legal names, national IDs, or sensitive medical files to the public. Donors see anonymized codes and respectful summaries, protecting beneficiary pride.',
                descAr: 'لا نكشف أبداً الأسماء القانونية أو الأرقام القومية أو الملفات الطبية الحساسة للعموم. يرى المتبرعون رموزاً مبهمة وملخصات محترمة تحفظ كرامة المستفيد.',
              },
              {
                icon: <Coins className="w-6 h-6" />,
                titleEn: 'Enforced Support Caps',
                titleAr: 'حدود دعم شهرية مُلزمة',
                descEn: 'By setting custom monthly caps based on verified evaluations, we prevent cases from being overfunded while others receive nothing. Resources are allocated fairly.',
                descAr: 'بتحديد حدود شهرية مخصصة بناءً على تقييمات موثقة، نمنع تجاوز تمويل أي حالة بينما تُحرم أخرى. يتم توزيع الموارد بعدالة.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                titleEn: 'Traceable Audit Logs',
                titleAr: 'سجلات تدقيق قابلة للتتبع',
                descEn: 'Every login, document review, and resource delivery is recorded on a permanent audit trail. Admins and charities operate with absolute accountability.',
                descAr: 'كل تسجيل دخول ومراجعة وثيقة وتسليم موارد مسجل في سجل تدقيق دائم. يعمل المشرفون والجمعيات بمساءلة تامة.',
              },
            ].map((item, i) => (
              <div key={i} className={`bg-slate-800/50 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all duration-300 group ${isRtl ? 'text-right' : ''}`}>
                <div className="w-12 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold">{language === 'ar' ? item.titleAr : item.titleEn}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{language === 'ar' ? item.descAr : item.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Navigation Block */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {language === 'ar' ? 'كيف تريد أن تشارك؟' : 'How Do You Want to Participate?'}
          </h2>
          <p className="text-slate-600">
            {language === 'ar'
              ? 'اختر نوع ملفك الشخصي للتسجيل أو تعرف على كيفية مشاركتك في منظومة الحوكمة.'
              : 'Select your profile type to register or learn how you fit into the governance system.'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {[
            {
              icon: <MapPin className="w-6 h-6" />,
              bgClass: 'bg-emerald-50',
              textClass: 'text-emerald-600',
              btnClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
              titleEn: 'For Donors',
              titleAr: 'للمتبرعين',
              descEn: 'Browse verified, anonymized needy cases near your neighborhood on a beautiful visual map. Provide monthly cash support or coordinate resource distributions directly.',
              descAr: 'استعرض الحالات الموثقة والمبهمة القريبة من حيك على خريطة بصرية جميلة. قدم دعماً نقدياً شهرياً أو نسّق توزيع الموارد مباشرة.',
              href: '/register?role=DONOR',
              btnEn: 'Register as Donor',
              btnAr: 'سجل كمتبرع',
            },
            {
              icon: <HeartHandshake className="w-6 h-6" />,
              bgClass: 'bg-teal-50',
              textClass: 'text-teal-600',
              btnClass: 'bg-teal-50 text-teal-700 hover:bg-teal-100',
              titleEn: 'For Beneficiaries',
              titleAr: 'للمستفيدين',
              descEn: 'Register securely, fill our onboarding needs assessment, and upload required documents. Once approved, receive transparent support from individual donors and registered organizations.',
              descAr: 'سجل بأمان، أكمل استمارة تقييم الاحتياجات، وارفع المستندات المطلوبة. بعد الموافقة، استلم دعماً شفافاً من متبرعين أفراد وجمعيات مسجلة.',
              href: '/register?role=BENEFICIARY',
              btnEn: 'Apply for Support',
              btnAr: 'تقدم للحصول على دعم',
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              bgClass: 'bg-slate-50',
              textClass: 'text-slate-600',
              btnClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
              titleEn: 'For Charity Organizations',
              titleAr: 'للجمعيات الخيرية',
              descEn: 'Coordinate with other charities to prevent duplication. View verified cases, manage campaigns, and report resource deliveries directly. Full Super Admin oversight ensures integrity.',
              descAr: 'نسّق مع الجمعيات الأخرى لتجنب التكرار. اعرض الحالات الموثقة، أدر الحملات، وسجّل توصيل الموارد مباشرة. الإشراف الكامل من المدير العام يضمن النزاهة.',
              href: '/register?role=CHARITY_ADMIN',
              btnEn: 'Register Organization',
              btnAr: 'سجل جمعيتك',
            },
          ].map((card, i) => (
            <div key={i} className={`bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all ${isRtl ? 'text-right' : ''}`}>
              <div className="space-y-4">
                <div className={`w-12 h-12 ${card.bgClass} ${card.textClass} rounded-2xl flex items-center justify-center`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  {language === 'ar' ? card.titleAr : card.titleEn}
                </h3>
                <p className="text-slate-550 text-sm leading-relaxed">
                  {language === 'ar' ? card.descAr : card.descEn}
                </p>
              </div>
              <Link
                href={card.href}
                className={`mt-8 block text-center px-4 py-2.5 ${card.btnClass} font-semibold rounded-xl transition-colors`}
              >
                {language === 'ar' ? card.btnAr : card.btnEn}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
