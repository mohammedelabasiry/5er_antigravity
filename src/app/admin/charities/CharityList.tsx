'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Globe, Phone, ExternalLink } from 'lucide-react';
import { translations } from '@/lib/translations';

interface Charity {
  id: string;
  charityName: string;
  licenseNumber: string;
  description: string;
  website: string | null;
  phone: string;
  isApproved: boolean;
  createdAt: Date;
  user: {
    email: string;
    createdAt: Date;
  };
}

interface CharityListProps {
  initialCharities: Charity[];
  lang: 'en' | 'ar';
}

export default function CharityList({ initialCharities, lang }: CharityListProps) {
  const [charities, setCharities] = useState<Charity[]>(initialCharities);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  const handleToggleApprove = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const response = await fetch(`/api/admin/charity/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });

      if (response.ok) {
        setCharities((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isApproved: !currentStatus } : c))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update charity state.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCharities = charities.filter(
    (c) =>
      c.charityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Search Filter */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchCharityPlaceholder')}
          className={`w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-slate-800 text-sm focus:outline-none transition-all ${isRtl ? 'text-right' : 'text-left'}`}
          dir={isRtl ? 'rtl' : 'ltr'}
        />
      </div>

      {/* Grid List */}
      {filteredCharities.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
          {t('noCharitiesMatch')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCharities.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={isRtl ? 'text-right' : ''}>
                    <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                      {c.charityName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">{t('licenseId')}: {c.licenseNumber}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      c.isApproved
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {c.isApproved ? t('approvedBadge') : t('pendingVerificationBadge')}
                  </span>
                </div>

                <p className={`text-xs text-slate-500 leading-normal ${isRtl ? 'text-right' : ''}`}>{c.description}</p>

                <div className={`space-y-1.5 pt-2 text-xs border-t border-slate-50 ${isRtl ? 'text-right' : ''}`}>
                  <p className={`flex items-center gap-1.5 text-slate-600 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {c.phone}
                  </p>
                  {c.website && (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 text-emerald-700 hover:underline ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {c.website.replace('https://', '').replace('www.', '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <p className="text-[10px] text-slate-400">
                    {t('accountEmail')}: {c.user.email} <br />
                    {t('registered')}: {new Date(c.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleToggleApprove(c.id, c.isApproved)}
                  disabled={togglingId === c.id}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                    c.isApproved
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-50'
                  }`}
                >
                  {togglingId === c.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : c.isApproved ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {t('suspendAccess')}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('approveOrganization')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
