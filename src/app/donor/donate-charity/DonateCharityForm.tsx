'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/LanguageContext';
import { Heart, Coins, ArrowLeft, CheckCircle2, ShieldAlert, BookOpen, Phone, Award } from 'lucide-react';
import Link from 'next/link';

interface Charity {
  id: string;
  charityName: string;
  licenseNumber: string;
  description: string;
  phone: string;
}

interface DonateCharityFormProps {
  charities: Charity[];
}

export default function DonateCharityForm({ charities }: DonateCharityFormProps) {
  const { t, language } = useTranslation();
  const isRtl = language === 'ar';
  const router = useRouter();

  const [selectedCharityId, setSelectedCharityId] = useState(charities[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedCharity = charities.find((c) => c.id === selectedCharityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError(isRtl ? 'يرجى إدخال مبلغ تبرع صحيح أكبر من الصفر' : 'Please enter a valid donation amount greater than zero.');
      return;
    }

    if (!selectedCharityId) {
      setError(isRtl ? 'يرجى اختيار جمعية خيرية' : 'Please select a charity organization.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/donor/donate-charity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charityProfileId: selectedCharityId,
          amount: parsedAmount,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit donation.');
      }

      setSuccess(true);
      setAmount('');
      setNotes('');
      setTimeout(() => {
        router.push('/donor/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* Back button */}
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

      {/* Main card */}
      <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
        
        {/* Title */}
        <div className={`flex items-center gap-3 border-b border-slate-50 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl text-white shadow-md shadow-emerald-100">
            <Heart className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('donateToCharity')}</h1>
            <p className="text-[11px] text-slate-450 mt-0.5">{t('donateToCharityDesc')}</p>
          </div>
        </div>

        {/* Error / Success feedback */}
        {error && (
          <div className={`p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2 ${
            isRtl ? 'flex-row-reverse' : ''
          }`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={`p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 ${
            isRtl ? 'flex-row-reverse' : ''
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('charityDonationSuccess')}</span>
          </div>
        )}

        {charities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            {isRtl ? 'لا توجد جمعيات خيرية معتمدة حالياً.' : 'No certified charity organizations available currently.'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Charity Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t('selectCharity')}
              </label>
              <select
                value={selectedCharityId}
                onChange={(e) => setSelectedCharityId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-750 focus:outline-none transition-all"
                required
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.charityName}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Charity Details Panel */}
            {selectedCharity && (
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 text-xs">
                <h4 className={`font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  {t('charityInfo')}
                </h4>
                
                <p className="text-slate-550 leading-relaxed font-medium">
                  {selectedCharity.description}
                </p>

                <div className={`grid grid-cols-2 gap-4 pt-2 border-t border-slate-100/50 text-[10px] text-slate-450 font-bold uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('licenseNumber')}: {selectedCharity.licenseNumber}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCharity.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t('donationAmount')}
              </label>
              <div className="relative">
                <Coins className={`absolute top-3.5 w-4 h-4 text-slate-400 ${isRtl ? 'right-4' : 'left-4'}`} />
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
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

            {/* Notes input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {t('donationNotes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isRtl ? "اكتب أي تعليمات خاصة بالتوزيع أو شروط التبرع..." : "Write any specific distribution instructions or preferences..."}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 hover:shadow-emerald-250 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  {t('btnDonateToCharity')}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
