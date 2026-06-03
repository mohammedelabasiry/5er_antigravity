'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/LanguageContext';
import { 
  Coins, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  MapPin, 
  Layers, 
  Sliders,
  Users,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

const AREAS = [
  { name: 'Downtown Cairo', nameAr: 'وسط البلد، القاهرة' },
  { name: 'Garden City', nameAr: 'جاردن سيتي' },
  { name: 'Zamalek', nameAr: 'الزمالك' },
  { name: 'Dokki', nameAr: 'الدقي' },
  { name: 'Mohandessin', nameAr: 'المهندسين' },
  { name: 'Giza', nameAr: 'الجيزة' },
  { name: 'Sayeda Zeinab', nameAr: 'السيدة زينب' },
  { name: 'Nasr City', nameAr: 'مدينة نصر' },
  { name: 'Heliopolis', nameAr: 'مصر الجديدة' },
  { name: 'Maadi', nameAr: 'المعادي' },
];

export default function BulkDonateForm() {
  const { t, language } = useTranslation();
  const isRtl = language === 'ar';
  const router = useRouter();

  // Form inputs
  const [totalAmount, setTotalAmount] = useState('20000');
  const [category, setCategory] = useState('ALL');
  const [areaName, setAreaName] = useState('ALL');
  const [maxPerBeneficiary, setMaxPerBeneficiary] = useState('');
  const [forceOverride, setForceOverride] = useState(false);

  // Preview & simulation state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    matchingFamilies: number;
    estimatedDistribution: number;
    averageSupportPerFamily: number;
    totalMatchedInSystem: number;
  } | null>(null);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<{
    familiesAssisted: number;
    totalDistributed: number;
  } | null>(null);

  // Trigger preview calculations on filter or amount changes
  useEffect(() => {
    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch('/api/donor/bulk-donate/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalAmount: Number(totalAmount) || 0,
            category,
            areaName,
            maxPerBeneficiary: maxPerBeneficiary ? Number(maxPerBeneficiary) : null,
            forceOverride,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setPreviewData(data);
        }
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        setPreviewLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchPreview();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [totalAmount, category, areaName, maxPerBeneficiary, forceOverride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSummary(null);

    const parsedAmount = Number(totalAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError(isRtl ? 'يرجى إدخال مبلغ إجمالي صحيح أكبر من الصفر' : 'Please enter a valid total amount.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/donor/bulk-donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: parsedAmount,
          category,
          areaName,
          maxPerBeneficiary: maxPerBeneficiary ? Number(maxPerBeneficiary) : null,
          forceOverride,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute bulk donation campaign.');
      }

      setSuccess(true);
      setSummary({
        familiesAssisted: data.familiesAssisted,
        totalDistributed: data.totalDistributed,
      });

      // Clear form
      setTotalAmount('');
      setMaxPerBeneficiary('');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* Back to dashboard */}
      <div>
        <Link
          href="/donor/dashboard"
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-550 hover:text-slate-800 transition-colors ${
            isRtl ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span>{isRtl ? 'العودة للوحة التحكم' : 'Back to Dashboard'}</span>
        </Link>
      </div>

      {/* Main Form Box */}
      <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
        
        {/* Title Block */}
        <div className={`flex items-center gap-3 border-b border-slate-50 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-md shadow-emerald-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('bulkDonation')}</h1>
            <p className="text-[11px] text-slate-450 mt-0.5">{t('bulkDonationDesc')}</p>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className={`p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2 ${
            isRtl ? 'flex-row-reverse' : ''
          }`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && summary && (
          <div className="space-y-4">
            <div className={`p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 ${
              isRtl ? 'flex-row-reverse' : ''
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('bulkDonationSuccess')}</span>
            </div>

            {/* Results card */}
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 space-y-3">
              <h3 className={`font-bold text-emerald-800 text-xs uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('bulkSummaryTitle')}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="bg-white p-3 border border-emerald-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-450 uppercase">{t('familiesAssisted')}</span>
                  <p className="text-emerald-700 text-lg">{summary.familiesAssisted}</p>
                </div>
                <div className="bg-white p-3 border border-emerald-100 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-450 uppercase">{t('totalDistributed')}</span>
                  <p className="text-emerald-700 text-lg">{summary.totalDistributed} {t('egp')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* The Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Total donation amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {isRtl ? 'إجمالي مبلغ التبرع للفرز والتوزيع' : 'Total Campaign Amount to Distribute'}
              </label>
              <div className="relative">
                <Coins className={`absolute top-3.5 w-4 h-4 text-slate-400 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input
                  type="number"
                  min="100"
                  step="any"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="20000"
                  className={`w-full py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 text-xs font-bold focus:outline-none transition-all ${
                    isRtl ? 'pr-11 pl-16 text-right' : 'pl-11 pr-16 text-left'
                  }`}
                  required
                />
                <span className={`absolute top-3 text-xs font-bold text-slate-450 uppercase tracking-wider ${isRtl ? 'left-4' : 'right-4'}`}>
                  {t('egp')}
                </span>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('filterCategory')}
                </label>
                <div className="relative">
                  <Layers className={`absolute top-3.5 w-4 h-4 text-slate-400 ${isRtl ? 'right-4' : 'left-4'}`} />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 ${
                      isRtl ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                    }`}
                  >
                    <option value="ALL">{t('allCategories')}</option>
                    <option value="A">Category A (Most Critical Need)</option>
                    <option value="B">Category B (High Need)</option>
                    <option value="C">Category C (Medium Need)</option>
                    <option value="D">Category D (Stable Support)</option>
                  </select>
                </div>
              </div>

              {/* Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('filterArea')}
                </label>
                <div className="relative">
                  <MapPin className={`absolute top-3.5 w-4 h-4 text-slate-400 ${isRtl ? 'right-4' : 'left-4'}`} />
                  <select
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    className={`w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-emerald-500 ${
                      isRtl ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                    }`}
                  >
                    <option value="ALL">{t('allAreas')}</option>
                    {AREAS.map((a) => (
                      <option key={a.name} value={a.name}>
                        {isRtl ? a.nameAr : a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Advanced parameters block */}
            <div className="border-t border-slate-50 pt-4 space-y-4">
              <h3 className={`font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Sliders className="w-4 h-4 text-emerald-600" />
                {isRtl ? 'معايير التحكم المتقدمة' : 'Advanced Distribution Controls'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Max amount per beneficiary */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {t('maxPerBeneficiary')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxPerBeneficiary}
                    onChange={(e) => setMaxPerBeneficiary(e.target.value)}
                    placeholder={isRtl ? "مثال: 2000 جنيه لكل أسرة" : "e.g. 2000 EGP per family"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                {/* Force override limit switch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {t('forceCapOverride')}
                  </label>
                  <div className={`flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl h-[46px] ${isRtl ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider leading-none">
                      {isRtl ? 'تجاوز السقف المالي' : 'Bypass cap'}
                    </span>
                    <input
                      type="checkbox"
                      checked={forceOverride}
                      onChange={(e) => setForceOverride(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-350 rounded transition-all cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Smart Evaluation Live Preview Panel */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
              <h4 className={`font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Users className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                {isRtl ? 'معاينة خوارزمية ذكية (توزيع مباشر)' : 'Smart Algorithm Preview'}
              </h4>

              {previewLoading ? (
                <div className="h-12 flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                </div>
              ) : previewData ? (
                <div className={`grid grid-cols-3 gap-3 text-center text-xs font-bold ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl space-y-0.5">
                    <span className="text-[9px] text-slate-400 block uppercase">{t('previewMatchingFamilies')}</span>
                    <span className="text-emerald-700 text-sm font-extrabold">{previewData.matchingFamilies}</span>
                  </div>
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl space-y-0.5">
                    <span className="text-[9px] text-slate-400 block uppercase">{isRtl ? 'إجمالي التوزيع المقدر' : 'Est. Distribution'}</span>
                    <span className="text-emerald-700 text-sm font-extrabold">{previewData.estimatedDistribution} {t('egp')}</span>
                  </div>
                  <div className="bg-white p-2.5 border border-slate-100 rounded-xl space-y-0.5">
                    <span className="text-[9px] text-slate-400 block uppercase">{t('previewWillReceive')}</span>
                    <span className="text-emerald-700 text-sm font-extrabold">{previewData.averageSupportPerFamily} {t('egp')}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Execute distribute button */}
            <button
              type="submit"
              disabled={loading || !previewData || previewData.matchingFamilies === 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 hover:shadow-emerald-250 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-bounce" />
                  {t('distributeBtn')}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
