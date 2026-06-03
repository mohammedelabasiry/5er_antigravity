'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/LanguageContext';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building2,
  Edit2,
  Rocket,
  Warehouse,
  Plus,
  Minus,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface ResourceDist {
  id: string;
  resourceType: string;
  quantity: number;
  estimatedValue: number;
  deliveryStatus: string;
  date: string;
  notes: string | null;
  beneficiaryProfile: {
    code: string;
    displayName: string;
  };
  charityProfile: {
    charityName: string;
  } | null;
  donorProfile: {
    displayName: string;
  } | null;
}

interface StockItem {
  id: string;
  resourceType: string;
  quantity: number;
  unit: string;
}

interface ResourceClientPageProps {
  initialDistributions: ResourceDist[];
  userRole: string;
}

const AREAS = [
  { name: 'All', nameAr: 'جميع المناطق' },
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

const RESOURCE_TYPES = [
  { value: 'Food Box', en: 'Food Box', ar: 'كرتونة مواد غذائية' },
  { value: 'Meat Distribution', en: 'Meat Distribution', ar: 'توزيع لحوم' },
  { value: 'Clothes', en: 'Clothes', ar: 'ملابس' },
  { value: 'Medicine', en: 'Medicine', ar: 'أدوية' },
  { value: 'School Supplies', en: 'School Supplies', ar: 'مستلزمات مدارس' },
  { value: 'Eid Package', en: 'Eid Package', ar: 'شنطة العيد' },
  { value: 'Emergency Resources', en: 'Emergency Resources', ar: 'موارد طارئة' },
];

export default function ResourceClientPage({
  initialDistributions,
  userRole
}: ResourceClientPageProps) {
  const router = useRouter();
  const { t, language, isRtl } = useTranslation();
  const [distributions, setDistributions] = useState<ResourceDist[]>(initialDistributions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusVal, setStatusVal] = useState<string>('PENDING');
  const [notesVal, setNotesVal] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canEdit = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'CHARITY_ADMIN';

  // Active tab for admin/charity: 'distributions' | 'campaign' | 'inventory'
  const [activeTab, setActiveTab] = useState<'distributions' | 'campaign' | 'inventory'>('distributions');

  // Campaign state
  const [campResourceType, setCampResourceType] = useState('Food Box');
  const [campQty, setCampQty] = useState(1);
  const [campValue, setCampValue] = useState(500);
  const [campArea, setCampArea] = useState('All');
  const [campCategory, setCampCategory] = useState('All');
  const [campForceOverride, setCampForceOverride] = useState(false);
  const [campDeductStock, setCampDeductStock] = useState(false);
  const [campNotes, setCampNotes] = useState('');
  const [campSubmitting, setCampSubmitting] = useState(false);
  const [campResult, setCampResult] = useState<any>(null);
  const [campError, setCampError] = useState<string | null>(null);

  // Stock state
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [newStockType, setNewStockType] = useState('');
  const [newStockQty, setNewStockQty] = useState(0);
  const [newStockUnit, setNewStockUnit] = useState('units');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  // Load stock when tab switches
  useEffect(() => {
    if (activeTab === 'inventory' && canEdit) {
      fetchStock();
    }
  }, [activeTab]);

  const fetchStock = async () => {
    setStockLoading(true);
    setStockError(null);
    try {
      const res = await fetch('/api/resources/stock');
      if (!res.ok) throw new Error('Failed to load stock');
      const data = await res.json();
      setStockItems(data);
    } catch (err: any) {
      setStockError(err.message);
    } finally {
      setStockLoading(false);
    }
  };

  // --- Distribution status editing ---
  const startEdit = (dist: ResourceDist) => {
    setEditingId(dist.id);
    setStatusVal(dist.deliveryStatus);
    setNotesVal(dist.notes || '');
    setErrorMsg(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/resources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          deliveryStatus: statusVal,
          notes: notesVal,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      // Update local state
      setDistributions((prev) =>
        prev.map((d) =>
          d.id === editingId
            ? { ...d, deliveryStatus: statusVal, notes: notesVal }
            : d
        )
      );
      setEditingId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Campaign execution ---
  const handleRunCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampSubmitting(true);
    setCampResult(null);
    setCampError(null);

    try {
      const res = await fetch('/api/resources/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: campResourceType,
          quantity: campQty,
          estimatedValue: campValue,
          areaName: campArea,
          category: campCategory,
          forceOverride: campForceOverride,
          deductStock: campDeductStock,
          notes: campNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Campaign failed');
      setCampResult(data);
    } catch (err: any) {
      setCampError(err.message);
    } finally {
      setCampSubmitting(false);
    }
  };

  // --- Stock adjustment ---
  const handleStockAdjust = async (resourceType: string, adjustQty: number, unit: string) => {
    try {
      const res = await fetch('/api/resources/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          quantity: adjustQty,
          unit,
          isAdjustment: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stock update failed');
      await fetchStock();
    } catch (err: any) {
      setStockError(err.message);
    }
  };

  const handleAddNewStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockType.trim()) return;
    setStockSubmitting(true);
    setStockError(null);
    try {
      const res = await fetch('/api/resources/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: newStockType.trim(),
          quantity: newStockQty,
          unit: newStockUnit,
          isAdjustment: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add stock');
      setNewStockType('');
      setNewStockQty(0);
      await fetchStock();
    } catch (err: any) {
      setStockError(err.message);
    } finally {
      setStockSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('delivered')}
          </span>
        );
      case 'EN_ROUTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-bold">
            <Truck className="w-3.5 h-3.5 animate-bounce" />
            {language === 'ar' ? 'جاري التوصيل' : 'En Route'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-bold">
            <Clock className="w-3.5 h-3.5" />
            {t('pending')}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            {language === 'ar' ? 'فشل التوصيل' : 'Delivery Failed'}
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">{status}</span>;
    }
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('resourceLogisticsPortal')}</h1>
          <p className="text-xs text-slate-500">
            {t('resourceLogisticsDesc')}
          </p>
        </div>

        {/* Tab Navigation (Admin/Charity only) */}
        {canEdit && (
          <div className={`flex p-1 bg-slate-100 rounded-xl gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setActiveTab('distributions')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'distributions'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Package className="w-4 h-4" />
              {t('resourceDistributions')}
            </button>
            <button
              onClick={() => setActiveTab('campaign')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'campaign'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Rocket className="w-4 h-4" />
              {t('executeCampaign')}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'inventory'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Warehouse className="w-4 h-4" />
              {t('inventorySettings')}
            </button>
          </div>
        )}

        {/* ========== Tab: Distributions ========== */}
        {activeTab === 'distributions' && (
          <div className="grid grid-cols-1 gap-6">
            {distributions.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-2">
                <Package className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="font-bold text-slate-650">{t('noResourceDistributions')}</p>
                <p className="text-xs">{t('noResourceDistributionsDesc')}</p>
              </div>
            ) : (
              distributions.map((d) => (
                <div
                  key={d.id}
                  className={`bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Details Column */}
                  <div className="flex-1 space-y-4">
                    <div className={`flex justify-between md:justify-start items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        ID: {d.id.slice(0, 8).toUpperCase()}
                      </span>
                      {getStatusBadge(d.deliveryStatus)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('resourceItem')}</span>
                        <p className={`text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                          {d.resourceType}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold">{language === 'ar' ? `الكمية: ${d.quantity} وحدة` : `Quantity: ${d.quantity} units`}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('beneficiaryFamily')}</span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">{d.beneficiaryProfile.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{t('caseId')}: {d.beneficiaryProfile.code}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('logisticsValue')}</span>
                        <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{d.estimatedValue.toLocaleString()} {t('egp')}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{t('estimatedMarketValue')}</p>
                      </div>
                    </div>

                    <div className={`border-t border-slate-50 pt-3 flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-slate-400 font-semibold ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {t('assignedDate')}: {new Date(d.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {t('distributingEntity')}:{' '}
                        {d.charityProfile
                          ? d.charityProfile.charityName
                          : d.donorProfile
                          ? d.donorProfile.displayName
                          : (language === 'ar' ? 'مشرف المنصة' : 'System Admin')}
                      </span>
                    </div>

                    {d.notes && (
                      <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 font-medium">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">{t('logisticsNotes')}:</span>
                        {d.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  {canEdit && (
                    <div className={`flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-105 pt-4 md:pt-0 md:pl-6 shrink-0 md:w-56 ${isRtl ? 'md:border-l-0 md:border-r md:pl-0 md:pr-6' : ''}`}>
                      {editingId === d.id ? (
                        <form onSubmit={handleUpdateStatus} className="space-y-3">
                          {errorMsg && (
                            <p className="text-[10px] text-rose-600 font-bold leading-normal">{errorMsg}</p>
                          )}
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('deliveryStatus')}</label>
                            <select
                              value={statusVal}
                              onChange={(e) => setStatusVal(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                            >
                              <option value="PENDING">{t('pending')}</option>
                              <option value="EN_ROUTE">{language === 'ar' ? 'جاري التوصيل' : 'En Route'}</option>
                              <option value="DELIVERED">{t('delivered')}</option>
                              <option value="FAILED">{language === 'ar' ? 'فشل التوصيل' : 'Failed'}</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">{t('statusNotes')}</label>
                            <textarea
                              value={notesVal}
                              onChange={(e) => setNotesVal(e.target.value)}
                              placeholder={t('addTrackingNotes')}
                              className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[50px] font-semibold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="py-1.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-xs font-semibold"
                            >
                              {t('cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="py-1.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                            >
                              {t('save')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => startEdit(d)}
                          className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-xl text-xs font-bold text-slate-705 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          {t('updateLogisticsStatus')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ========== Tab: Campaign ========== */}
        {activeTab === 'campaign' && canEdit && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className={`flex items-center gap-2.5 border-b border-slate-50 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Rocket className="text-emerald-600 w-5 h-5" />
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">{t('executeCampaign')}</h3>
            </div>

            {campResult && (
              <div className={`p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <p className={`text-sm font-bold text-emerald-800 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <ShieldCheck className="w-5 h-5" />
                  {t('campaignSuccess')}
                </p>
                <p className="text-xs text-emerald-700">
                  {language === 'ar'
                    ? `المستهدفون: ${campResult.totalTargeted} | نجح: ${campResult.totalSucceeded} | تم تخطيه: ${campResult.totalSkipped}`
                    : `Targeted: ${campResult.totalTargeted} | Succeeded: ${campResult.totalSucceeded} | Skipped: ${campResult.totalSkipped}`}
                </p>
              </div>
            )}

            {campError && (
              <div className={`p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl flex items-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {campError}
              </div>
            )}

            <form onSubmit={handleRunCampaign} className="space-y-6">
              <p className={`text-xs font-bold text-slate-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('campaignSettings')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('resourceType')}</label>
                  <select
                    value={campResourceType}
                    onChange={(e) => setCampResourceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  >
                    {RESOURCE_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {language === 'ar' ? rt.ar : rt.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('qtyPerFamily')}</label>
                  <input
                    type="number"
                    min={1}
                    value={campQty}
                    onChange={(e) => setCampQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('estimatedValue')} ({t('egp')})</label>
                  <input
                    type="number"
                    min={1}
                    value={campValue}
                    onChange={(e) => setCampValue(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{language === 'ar' ? 'المنطقة المستهدفة' : 'Target Area'}</label>
                  <select
                    value={campArea}
                    onChange={(e) => setCampArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  >
                    {AREAS.map((a) => (
                      <option key={a.name} value={a.name}>{language === 'ar' ? a.nameAr : a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('category')}</label>
                  <select
                    value={campCategory}
                    onChange={(e) => setCampCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  >
                    <option value="All">{language === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                    <option value="A">{language === 'ar' ? 'فئة أ - حرج جداً' : 'Category A - Extremely Vulnerable'}</option>
                    <option value="B">{language === 'ar' ? 'فئة ب - بحاجة شديدة' : 'Category B - Very Needy'}</option>
                    <option value="C">{language === 'ar' ? 'فئة ج - بحاجة' : 'Category C - Needy'}</option>
                    <option value="D">{language === 'ar' ? 'فئة د - محدودة' : 'Category D - Limited'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('notesOptional')}</label>
                <textarea
                  value={campNotes}
                  onChange={(e) => setCampNotes(e.target.value)}
                  rows={2}
                  placeholder={language === 'ar' ? 'ملاحظات على الحملة...' : 'Campaign notes...'}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <div className={`p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                  <input
                    type="checkbox"
                    id="forceOverride"
                    checked={campForceOverride}
                    onChange={(e) => setCampForceOverride(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="forceOverride" className="text-[11px] text-slate-600 font-semibold cursor-pointer select-none leading-relaxed">
                    {t('forceCapOverride')}
                  </label>
                </div>

                <div className={`p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
                  <input
                    type="checkbox"
                    id="deductStock"
                    checked={campDeductStock}
                    onChange={(e) => setCampDeductStock(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="deductStock" className="text-[11px] text-slate-600 font-semibold cursor-pointer select-none leading-relaxed">
                    {t('deductStock')}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={campSubmitting}
                className={`w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
              >
                {campSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t('runCampaign')}
              </button>
            </form>
          </div>
        )}

        {/* ========== Tab: Inventory ========== */}
        {activeTab === 'inventory' && canEdit && (
          <div className="space-y-6">
            {/* Stock Table */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className={`flex items-center gap-2.5 border-b border-slate-50 pb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Warehouse className="text-emerald-600 w-5 h-5" />
                <h3 className="font-bold text-slate-800 text-base sm:text-lg">{t('inventorySettings')}</h3>
              </div>

              {stockError && (
                <div className={`p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-xl flex items-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {stockError}
                </div>
              )}

              {stockLoading ? (
                <div className="text-center py-12">
                  <span className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block" />
                </div>
              ) : stockItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">{language === 'ar' ? 'لا يوجد مخزون مسجل' : 'No stock items recorded'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase ${isRtl ? 'text-right' : 'text-left'}`}>
                        <th className="pb-3">{t('resourceItem')}</th>
                        <th className="pb-3">{t('quantity')}</th>
                        <th className="pb-3">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                        <th className="pb-3 text-center">{t('stockAdjustment')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className={`py-3.5 font-bold text-slate-800 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                            {item.resourceType}
                          </td>
                          <td className="py-3.5">
                            <span className={`text-lg font-extrabold ${item.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3.5 text-xs text-slate-500 font-semibold">{item.unit}</td>
                          <td className="py-3.5">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleStockAdjust(item.resourceType, -10, item.unit)}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 flex items-center justify-center transition-colors"
                                title="-10"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStockAdjust(item.resourceType, -1, item.unit)}
                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors text-[10px] font-bold"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => handleStockAdjust(item.resourceType, 1, item.unit)}
                                className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors text-[10px] font-bold"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => handleStockAdjust(item.resourceType, 10, item.unit)}
                                className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center transition-colors"
                                title="+10"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add new stock type */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className={`font-bold text-slate-700 text-sm flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Plus className="w-4 h-4 text-emerald-600" />
                {t('addStockItem')}
              </h4>

              <form onSubmit={handleAddNewStock} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('resourceType')}</label>
                  <input
                    type="text"
                    value={newStockType}
                    onChange={(e) => setNewStockType(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: خضروات' : 'e.g. Vegetables'}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{t('quantity')}</label>
                  <input
                    type="number"
                    min={0}
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">{language === 'ar' ? 'الوحدة' : 'Unit'}</label>
                  <select
                    value={newStockUnit}
                    onChange={(e) => setNewStockUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-semibold focus:outline-none transition-all"
                  >
                    <option value="units">{language === 'ar' ? 'وحدات' : 'units'}</option>
                    <option value="kg">{language === 'ar' ? 'كيلو' : 'kg'}</option>
                    <option value="boxes">{language === 'ar' ? 'كراتين' : 'boxes'}</option>
                    <option value="bags">{language === 'ar' ? 'أكياس' : 'bags'}</option>
                    <option value="pieces">{language === 'ar' ? 'قطع' : 'pieces'}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={stockSubmitting || !newStockType.trim()}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {stockSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t('save')}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
