'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/LanguageContext';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building2,
  Edit2
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

interface ResourceClientPageProps {
  initialDistributions: ResourceDist[];
  userRole: string;
}

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

        {/* List Layout */}
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

      </div>
    </div>
  );
}
