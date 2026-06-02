'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Coins, Package, ShieldCheck, ShieldAlert, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

export default function DonatePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { t, isRtl, language } = useTranslation();

  const [beneficiary, setBeneficiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [amount, setAmount] = useState<number>(500);
  const [type, setType] = useState<'CASH' | 'RESOURCE'>('CASH');
  const [resourceType, setResourceType] = useState('Food Box');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function fetchBeneficiary() {
      try {
        const res = await fetch(`/api/beneficiary/public/${code}`);
        if (res.ok) {
          const data = await res.json();
          setBeneficiary(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchBeneficiary();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/donor/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryProfileId: beneficiary?.id,
          amount,
          type,
          resourceType: type === 'RESOURCE' ? resourceType : undefined,
          quantity: type === 'RESOURCE' ? quantity : undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isRtl ? 'فشلت عملية التبرع.' : 'Donation failed.'));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getSuccessMsg = () => {
    if (language === 'ar') {
      return (
        <p className="text-sm text-slate-500">
          تم تسجيل مساهمتك بقيمة <strong>{amount} {t('egp')}</strong> بنجاح. سيتم إخطار المستفيد وتوجيه الدعم له.
        </p>
      );
    }
    return (
      <p className="text-sm text-slate-500">
        Your contribution of <strong>{amount} EGP</strong> has been recorded successfully. The beneficiary will be notified.
      </p>
    );
  };

  if (success) {
    return (
      <div className={`flex-1 flex items-center justify-center px-4 py-16 ${isRtl ? 'text-right' : 'text-left'}`}>
        <div className="max-w-md w-full bg-white border border-slate-100 shadow-xl rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{t('jazakAllahu')}</h2>
          {getSuccessMsg()}
          <div className={`flex gap-3 justify-center pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Link href="/donor/dashboard" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
              {t('backToDashboard')}
            </Link>
            <Link href={`/donor/beneficiary/${code}`} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
              {t('viewProfile')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/donor/beneficiary/${code}`}
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} /> {t('backToCaseProfile')}
        </Link>

        <div className="bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden">
          <div className={`bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white ${isRtl ? 'text-right' : 'text-left'}`}>
            <h2 className={`text-xl font-bold flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Coins className="w-5 h-5" /> {t('contributeTo')} {code}
            </h2>
            <p className="text-emerald-50 text-xs mt-1">{t('secureTransaction')}</p>
          </div>

          {beneficiary && (
            <div className={`p-4 bg-emerald-50/50 border-b border-emerald-100 text-xs flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="font-bold text-emerald-800">{beneficiary.displayName}</span>
              <span className="text-emerald-700">{t('remaining')}: {Math.max(0, beneficiary.monthlySupportCap - beneficiary.monthlyReceivedAmount)} {t('egp')}</span>
            </div>
          )}

          {error && (
            <div className={`m-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 text-sm rounded-2xl flex items-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
              <button type="button" onClick={() => setType('CASH')}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${type === 'CASH' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}>
                <Coins className="w-4 h-4" /> {t('cash')}
              </button>
              <button type="button" onClick={() => setType('RESOURCE')}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${type === 'RESOURCE' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'}`}>
                <Package className="w-4 h-4" /> {t('resource')}
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1 block">
                {type === 'CASH' ? t('amountEgp') : t('estimatedValue')}
              </label>
              <input type="number" required min={1} value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-lg font-bold focus:outline-none transition-all" />
              <div className={`flex flex-wrap gap-2 pt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {[500, 1000, 2000, 3000, 5000].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${amount === v ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {type === 'RESOURCE' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1 block">{t('resourceType')}</label>
                  <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all">
                    <option value="Food Box">{language === 'ar' ? 'كرتونة مواد غذائية' : 'Food Box'}</option>
                    <option value="Eid Package">{language === 'ar' ? 'شنطة العيد' : 'Eid Package'}</option>
                    <option value="Clothes">{language === 'ar' ? 'ملابس' : 'Clothes'}</option>
                    <option value="Medicine">{language === 'ar' ? 'أدوية' : 'Medicine'}</option>
                    <option value="School Supplies">{language === 'ar' ? 'مستلزمات مدارس' : 'School Supplies'}</option>
                    <option value="Meat Distribution">{language === 'ar' ? 'توزيع لحوم' : 'Meat Distribution'}</option>
                    <option value="Emergency Resources">{language === 'ar' ? 'موارد طارئة' : 'Emergency Resources'}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1 block">{t('quantity')}</label>
                  <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ps-1 block">{t('notesOptional')}</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={isRtl ? "مثال: سوف تصلك غداً كرتونة المواد الغذائية." : "e.g. You will receive the physical food box tomorrow."}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none" />
            </div>

            <button type="submit" disabled={submitting || loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl py-3.5 shadow-lg shadow-emerald-100 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : t('confirmDonation')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
