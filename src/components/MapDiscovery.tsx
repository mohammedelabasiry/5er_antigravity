'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/LanguageContext';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Filter, 
  Heart, 
  Info, 
  HelpCircle,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface Beneficiary {
  id: string;
  code: string;
  displayName: string;
  category: string;
  monthlySupportCap: number;
  monthlyReceivedAmount: number;
  caseSummary: string;
  areaName: string;
  latitude: number;
  longitude: number;
  familyMembersCount: number;
  childrenCount: number;
  evaluationScore: number;
}

export default function MapDiscovery() {
  const { t, language, isRtl } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // State
  const [allCases, setAllCases] = useState<Beneficiary[]>([]);
  const [filteredCases, setFilteredCases] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [centerCoords, setCenterCoords] = useState<[number, number]>([30.0444, 31.2357]); // Default Cairo
  const [radiusKm, setRadiusKm] = useState<number>(5); // Default 5km radius
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [onlyShowUnsatisfied, setOnlyShowUnsatisfied] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCase, setSelectedCase] = useState<Beneficiary | null>(null);

  // Fetch all approved cases
  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        const res = await fetch('/api/beneficiary/list');
        if (!res.ok) throw new Error('Failed to load beneficiaries');
        const data = await res.json();
        setAllCases(data);
      } catch (err: any) {
        setError(err.message || 'Error occurred while loading data');
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  // Set user's physical location if available
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCenterCoords(newCoords);
          if (mapRef.current) {
            mapRef.current.setView(newCoords, 13);
          }
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
          // Fallback is default Cairo
        }
      );
    }
  };

  // Run filtering logic whenever filter parameters change
  useEffect(() => {
    // Distance helper (Haversine formula)
    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the earth in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };

    const filtered = allCases.filter((b) => {
      // 1. Distance check
      const dist = getDistanceKm(centerCoords[0], centerCoords[1], b.latitude, b.longitude);
      if (dist > radiusKm) return false;

      // 2. Category check
      if (!selectedCategories.includes(b.category)) return false;

      // 3. Uncovered need check
      if (onlyShowUnsatisfied) {
        const remaining = b.monthlySupportCap - b.monthlyReceivedAmount;
        if (remaining <= 0) return false;
      }

      // 4. Text Search Check
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = b.displayName.toLowerCase().includes(query);
        const matchesCode = b.code.toLowerCase().includes(query);
        const matchesArea = b.areaName.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesArea) return false;
      }

      return true;
    });

    setFilteredCases(filtered);
  }, [allCases, centerCoords, radiusKm, selectedCategories, onlyShowUnsatisfied, searchQuery]);

  // Leaflet Map Initialization and updates
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let map: any;

    async function initMap() {
      const L = await import('leaflet');

      // Initialize map if not exists
      if (!mapRef.current) {
        map = L.map(mapContainerRef.current!).setView(centerCoords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapRef.current = map;

        // Click to change search center
        map.on('click', (e: any) => {
          setCenterCoords([e.latlng.lat, e.latlng.lng]);
        });
      } else {
        map = mapRef.current;
      }

      // 1. Update/Add User Selected Location Marker
      const customUserIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-25 animate-ping"></span>
            <div class="w-7 h-7 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(centerCoords);
      } else {
        userMarkerRef.current = L.marker(centerCoords, { icon: customUserIcon }).addTo(map);
      }

      // 2. Update/Add Radius Circle
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng(centerCoords);
        radiusCircleRef.current.setRadius(radiusKm * 1000);
      } else {
        radiusCircleRef.current = L.circle(centerCoords, {
          radius: radiusKm * 1000,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          weight: 1.5,
        }).addTo(map);
      }

      // 3. Clear existing beneficiary markers
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current = [];

      // 4. Add filtered beneficiary markers
      filteredCases.forEach((b) => {
        let color = 'bg-emerald-500';
        if (b.category === 'A') color = 'bg-rose-500';
        else if (b.category === 'B') color = 'bg-amber-500';
        else if (b.category === 'C') color = 'bg-blue-500';

        const customBeneficiaryIcon = L.divIcon({
          className: `beneficiary-marker-${b.id}`,
          html: `
            <div class="relative w-8 h-8 flex items-center justify-center cursor-pointer group">
              <span class="absolute inline-flex h-8 w-8 rounded-full ${color} opacity-30 animate-pulse"></span>
              <div class="relative w-6 h-6 rounded-full border-2 border-white shadow-md ${color} text-white text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-125">
                ${b.category}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([b.latitude, b.longitude], { icon: customBeneficiaryIcon }).addTo(map);
        
        // Add click listener
        marker.on('click', () => {
          setSelectedCase(b);
          map.setView([b.latitude, b.longitude], 14);
        });

        markersRef.current.push(marker);
      });
    }

    initMap();

    // Clean up
    return () => {
      // Keep map alive but cleanup markers on filter changes
    };
  }, [centerCoords, radiusKm, filteredCases]);

  // Handle case selection from list
  const handleSelectCaseFromList = (b: Beneficiary) => {
    setSelectedCase(b);
    if (mapRef.current) {
      mapRef.current.setView([b.latitude, b.longitude], 14);
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] lg:flex-row overflow-hidden bg-slate-50 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Sidebar Panel for filters and results */}
      <div className={`w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col h-1/2 lg:h-full overflow-hidden shadow-sm z-10 ${isRtl ? 'lg:border-r-0 lg:border-l' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className={`flex items-center gap-2 text-emerald-700 font-extrabold text-sm sm:text-base ${isRtl ? 'flex-row-reverse' : ''}`}>
            <MapPin className="w-5 h-5" />
            <span>{t('mapPortal')}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {t('privacyShielded')}
          </p>
        </div>

        {/* Filters Panel */}
        <div className="p-4 border-b border-slate-100 space-y-4 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className={`absolute start-3 top-2.5 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs"
            />
          </div>

          {/* Range Slider */}
          <div className="space-y-1">
            <div className={`flex justify-between font-semibold text-slate-700 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span>{t('searchRadius')}:</span>
              <span className="text-emerald-600 font-bold">{radiusKm} km</span>
            </div>
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-150 rounded-lg"
              />
              <button
                onClick={handleLocateUser}
                title="Use Current Location"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-1.5">
            <span className={`font-semibold text-slate-700 block ${isRtl ? 'text-right' : ''}`}>{t('category')}:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['A', 'B', 'C', 'D'].map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                let colorClass = 'bg-rose-500 text-white';
                if (cat === 'B') colorClass = 'bg-amber-500 text-white';
                if (cat === 'C') colorClass = 'bg-blue-500 text-white';
                if (cat === 'D') colorClass = 'bg-emerald-500 text-white';

                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`py-1.5 rounded-lg font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                      isSelected 
                        ? `${colorClass} border-transparent shadow-sm` 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[7px] uppercase font-normal opacity-80">
                      {cat === 'A' ? t('critical') : cat === 'B' ? t('high') : cat === 'C' ? t('medium') : t('low')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Uncovered Need Toggle */}
          <label className={`flex items-center gap-2 cursor-pointer py-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <input
              type="checkbox"
              checked={onlyShowUnsatisfied}
              onChange={(e) => setOnlyShowUnsatisfied(e.target.checked)}
              className="rounded accent-emerald-600 h-4 w-4"
            />
            <span className="text-slate-600 font-medium">{t('onlyShowNeeding')}</span>
          </label>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className={`flex justify-between items-center text-xs text-slate-400 font-semibold mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span>{t('matches')} ({filteredCases.length})</span>
            {searchQuery || !onlyShowUnsatisfied || radiusKm !== 5 || selectedCategories.length !== 4 ? (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setRadiusKm(5);
                  setSelectedCategories(['A', 'B', 'C', 'D']);
                  setOnlyShowUnsatisfied(true);
                }} 
                className="text-rose-600 hover:underline text-[10px]"
              >
                {t('resetFilters')}
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
              <p className="text-xs">{t('loadingLocalCases')}</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {t('noCasesFound')}
            </div>
          ) : (
            filteredCases.map((b) => {
              const remaining = Math.max(0, b.monthlySupportCap - b.monthlyReceivedAmount);
              const progress = Math.min(
                100,
                Math.round((b.monthlyReceivedAmount / b.monthlySupportCap) * 100)
              );

              let catBadge = 'bg-rose-50 text-rose-700 border-rose-100';
              if (b.category === 'B') catBadge = 'bg-amber-50 text-amber-700 border-amber-100';
              if (b.category === 'C') catBadge = 'bg-blue-50 text-blue-700 border-blue-100';
              if (b.category === 'D') catBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';

              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectCaseFromList(b)}
                  className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-2 hover:shadow-md ${
                    selectedCase?.id === b.id
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="space-y-0.5">
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        {b.code}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{b.displayName}</h4>
                      <p className="text-[10px] text-slate-400">{b.areaName}</p>
                    </div>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-md ${catBadge}`}>
                      {t('category')} {b.category}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-normal">
                    {b.caseSummary}
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className={`flex justify-between text-[9px] font-medium text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span>{t('progressToTarget')}: {progress}%</span>
                      <span className="font-bold text-emerald-800">{remaining} {t('egpRemaining')}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map View & Selected Case Floating Panel (Right side) */}
      <div className="flex-1 relative h-1/2 lg:h-full">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Selected Case Floating Detail Card */}
        {selectedCase && (
          <div className={`absolute bottom-4 start-4 end-4 md:start-auto md:end-4 md:w-96 bg-white rounded-3xl border border-slate-150 shadow-2xl p-5 z-20 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className={`flex justify-between items-start border-b border-slate-100 pb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div>
                <span className="font-mono text-[10px] font-bold text-slate-400 block">
                  {selectedCase.code}
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  {selectedCase.displayName}
                </h3>
                <p className={`text-[11px] text-slate-400 font-medium flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedCase.areaName} ({t('approxBoundary')})
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedCase.caseSummary}
              </p>

              <div className={`grid grid-cols-2 gap-3 text-xs border-y border-slate-50 py-3 bg-slate-50/50 rounded-2xl px-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t('categoryLabel')}</span>
                  <span className="font-bold text-slate-800">{t('category')} {selectedCase.category} ({selectedCase.evaluationScore} {t('score')})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t('familyDetails')}</span>
                  <span className="font-bold text-slate-800">
                    {selectedCase.familyMembersCount} {t('members')} ({selectedCase.childrenCount} {t('kids')})
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 text-xs">
                <div className={`flex justify-between text-slate-600 font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span>{t('coveredProgress')}</span>
                  <span className="font-bold text-emerald-700">
                    {selectedCase.monthlyReceivedAmount} / {selectedCase.monthlySupportCap} EGP
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((selectedCase.monthlyReceivedAmount / selectedCase.monthlySupportCap) * 100)
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href={`/donor/beneficiary/${selectedCase.code}`}
                className="py-2.5 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                {t('anonymousDetails')}
              </Link>
              <Link
                href={`/donor/donate/${selectedCase.code}`}
                className="py-2.5 text-center bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-100 transition-all duration-300"
              >
                {t('donateDirect')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
