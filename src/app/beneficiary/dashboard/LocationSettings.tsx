'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/LanguageContext';
import { MapPin, Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react';

const AREAS = [
  { name: 'Downtown Cairo', nameAr: 'وسط البلد، القاهرة', lat: 30.0480, lng: 31.2330 },
  { name: 'Garden City', nameAr: 'جاردن سيتي', lat: 30.0400, lng: 31.2400 },
  { name: 'Zamalek', nameAr: 'الزمالك', lat: 30.0520, lng: 31.2280 },
  { name: 'Dokki', nameAr: 'الدقي', lat: 30.0250, lng: 31.2200 },
  { name: 'Mohandessin', nameAr: 'المهندسين', lat: 30.0650, lng: 31.2600 },
  { name: 'Giza', nameAr: 'الجيزة', lat: 30.0800, lng: 31.2000 },
  { name: 'Sayeda Zeinab', nameAr: 'السيدة زينب', lat: 30.0350, lng: 31.2500 },
  { name: 'Nasr City', nameAr: 'مدينة نصر', lat: 30.0100, lng: 31.2900 },
  { name: 'Heliopolis', nameAr: 'مصر الجديدة', lat: 30.0950, lng: 31.3100 },
  { name: 'Maadi', nameAr: 'المعادي', lat: 29.9800, lng: 31.2700 },
];

interface LocationSettingsProps {
  initialAreaName: string;
  initialShowOnMap: boolean;
}

export default function LocationSettings({
  initialAreaName,
  initialShowOnMap,
}: LocationSettingsProps) {
  const { t, language, isRtl } = useTranslation();
  
  // Find index of initial area
  const initialIndex = AREAS.findIndex(a => a.name.toLowerCase() === initialAreaName.toLowerCase());
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [showOnMap, setShowOnMap] = useState(initialShowOnMap);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const area = AREAS[selectedAreaIndex];

    try {
      const response = await fetch('/api/beneficiary/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaName: area.name,
          latitude: area.lat,
          longitude: area.lng,
          showOnMap,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update location settings');
      }

      setMessage(t('locationUpdatedSuccess'));
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className={`flex items-center gap-2.5 border-b border-slate-50 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <MapPin className="text-emerald-600 w-5 h-5 shrink-0" />
        <h3 className="font-bold text-slate-800 text-base sm:text-lg">
          {t('mapVisibilityTitle')}
        </h3>
      </div>

      {message && (
        <div className={`p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {error && (
        <div className={`p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs sm:text-sm rounded-2xl flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5 text-left">
            <label className={`text-xs font-bold text-slate-500 uppercase tracking-wider ps-1 block ${isRtl ? 'text-right' : ''}`}>
              {t('currentLocation')}
            </label>
            <select
              value={selectedAreaIndex}
              onChange={(e) => setSelectedAreaIndex(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all font-medium"
            >
              {AREAS.map((area, index) => (
                <option key={area.name} value={index}>
                  {language === 'ar' ? area.nameAr : area.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between text-xs ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
            <div>
              <p className="font-semibold text-slate-700">{t('approxBoundary')}</p>
              <p className="text-slate-400 mt-0.5 font-mono">
                Lat: {AREAS[selectedAreaIndex].lat.toFixed(4)}, Lng: {AREAS[selectedAreaIndex].lng.toFixed(4)}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-100">
              {t('approxLocation')}
            </span>
          </div>
        </div>

        {/* Map Visibility Toggle Switch */}
        <div className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3.5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <div className="flex items-center mt-0.5">
            <input
              type="checkbox"
              id="showOnMap"
              checked={showOnMap}
              onChange={(e) => setShowOnMap(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
            />
          </div>
          <label htmlFor="showOnMap" className="space-y-0.5 cursor-pointer select-none">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              {showOnMap ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              {t('showOnMapLabel')}
            </span>
            <span className="text-[11px] text-slate-500 block leading-relaxed font-semibold">
              {t('showOnMapDesc')}
            </span>
          </label>
        </div>

        <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t('updateSettingsBtn')}
          </button>
        </div>
      </form>
    </div>
  );
}
