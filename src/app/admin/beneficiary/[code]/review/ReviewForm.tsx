'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Unlock, MessageSquare, ShieldCheck, ShieldAlert } from 'lucide-react';
import { translations } from '@/lib/LanguageContext';

interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
}

interface ReviewFormProps {
  profileId: string;
  initialCap: number;
  initialCategory: string;
  adminNotesHistory: AdminNote[];
  lang: 'en' | 'ar';
}

export default function ReviewForm({
  profileId,
  initialCap,
  initialCategory,
  adminNotesHistory,
  lang,
}: ReviewFormProps) {
  const router = useRouter();
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };
  
  const [category, setCategory] = useState(initialCategory);
  const [monthlySupportCap, setMonthlySupportCap] = useState(initialCap);
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [isEligibleOverride, setIsEligibleOverride] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically update recommended cap if category is modified by admin
  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (cat === 'A') setMonthlySupportCap(7000);
    else if (cat === 'B') setMonthlySupportCap(5000);
    else if (cat === 'C') setMonthlySupportCap(3000);
    else if (cat === 'D') setMonthlySupportCap(1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/beneficiary/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          monthlySupportCap: Number(monthlySupportCap),
          isEligibleOverride,
          noteText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      router.refresh();
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      <h3 className={`font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <ShieldCheck className="text-emerald-600 w-4 h-4" />
        {t('governanceDecision')}
      </h3>

      {error && (
        <div className={`p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-start gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Status selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {t('decisionAction')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('APPROVED')}
              className={`py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                status === 'APPROVED'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm shadow-emerald-50'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {t('approveCase')}
            </button>
            <button
              type="button"
              onClick={() => setStatus('REJECTED')}
              className={`py-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                status === 'REJECTED'
                  ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm shadow-rose-50'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4" />
              {t('rejectApplication')}
            </button>
          </div>
        </div>

        {/* Category brackets */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            {t('needCategoryBracket')}
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-slate-800 text-sm focus:outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <option value="A">{t('categoryA')}</option>
            <option value="B">{t('categoryB')}</option>
            <option value="C">{t('categoryC')}</option>
            <option value="D">{t('categoryD')}</option>
          </select>
        </div>

        {/* Cap Support Target */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            {t('monthlyCapSupport')}
          </label>
          <input
            type="number"
            required
            value={monthlySupportCap}
            onChange={(e) => setMonthlySupportCap(Math.max(0, Number(e.target.value)))}
            className={`w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-slate-800 text-sm focus:outline-none transition-all font-bold text-slate-900 ${isRtl ? 'text-right' : 'text-left'}`}
          />
        </div>

        {/* Override toggle */}
        <div className={`p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <input
            type="checkbox"
            id="override"
            checked={isEligibleOverride}
            onChange={(e) => setIsEligibleOverride(e.target.checked)}
            className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
          />
          <div className={`space-y-0.5 ${isRtl ? 'text-right' : ''}`}>
            <label htmlFor="override" className={`text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
              {t('adminCapOverride')}
            </label>
            <p className="text-[10px] text-slate-400 leading-normal">
              {t('adminCapOverrideDesc')}
            </p>
          </div>
        </div>

        {/* Review Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
            {t('auditorComments')}
          </label>
          <textarea
            required={status === 'REJECTED'}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t('documentReasonPlaceholder')}
            rows={4}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none ${isRtl ? 'text-right' : 'text-left'}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl py-3 shadow-md transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            t('commitAuditVerdict')
          )}
        </button>
      </form>

      {/* Admin Notes History */}
      {adminNotesHistory.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h4 className={`text-xs font-bold text-slate-700 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <MessageSquare className="w-4 h-4 text-slate-400" />
            {t('decisionAuditTrail')}
          </h4>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {adminNotesHistory.map((note) => (
              <div key={note.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <p className={`text-slate-650 leading-relaxed font-medium ${isRtl ? 'text-right' : ''}`}>{note.content}</p>
                <p className={`text-[10px] text-slate-400 mt-1 ${isRtl ? 'text-right' : ''}`}>
                  {new Date(note.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
