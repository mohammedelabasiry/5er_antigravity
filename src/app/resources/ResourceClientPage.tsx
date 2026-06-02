'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
            Delivered
          </span>
        );
      case 'EN_ROUTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg font-bold">
            <Truck className="w-3.5 h-3.5 animate-bounce" />
            En Route
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg font-bold">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            Delivery Failed
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resource Logistics Portal</h1>
          <p className="text-xs text-slate-550">
            Track and verify the distribution of physical resources (food crates, medicine, supplies) to registered beneficiary families.
          </p>
        </div>

        {/* List Layout */}
        <div className="grid grid-cols-1 gap-6">
          {distributions.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-2">
              <Package className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="font-bold text-slate-650">No resource distributions recorded</p>
              <p className="text-xs">There are no physical goods deliveries pending or completed in the system.</p>
            </div>
          ) : (
            distributions.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-6"
              >
                {/* Details Column */}
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between md:justify-start items-center gap-3">
                    <span className="font-mono text-[9px] font-bold text-slate-400">
                      ID: {d.id.slice(0, 8).toUpperCase()}
                    </span>
                    {getStatusBadge(d.deliveryStatus)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Resource Item</span>
                      <p className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                        {d.resourceType}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold">Quantity: {d.quantity} units</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Beneficiary Family</span>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{d.beneficiaryProfile.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Code: {d.beneficiaryProfile.code}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Logistics Value</span>
                      <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{d.estimatedValue.toLocaleString()} EGP</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Estimated Market Value</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-3 flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Assigned: {new Date(d.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Distributing Entity:{' '}
                      {d.charityProfile
                        ? d.charityProfile.charityName
                        : d.donorProfile
                        ? d.donorProfile.displayName
                        : 'System Admin'}
                    </span>
                  </div>

                  {d.notes && (
                    <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-650 font-medium">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Logistics Notes:</span>
                      {d.notes}
                    </div>
                  )}
                </div>

                {/* Actions Column */}
                {canEdit && (
                  <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0 md:w-56">
                    {editingId === d.id ? (
                      <form onSubmit={handleUpdateStatus} className="space-y-3">
                        {errorMsg && (
                          <p className="text-[10px] text-rose-600 font-bold leading-normal">{errorMsg}</p>
                        )}
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Delivery Status</label>
                          <select
                            value={statusVal}
                            onChange={(e) => setStatusVal(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="EN_ROUTE">En Route</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="FAILED">Failed</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Status Notes</label>
                          <textarea
                            value={notesVal}
                            onChange={(e) => setNotesVal(e.target.value)}
                            placeholder="Add tracking notes..."
                            className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[50px] font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="py-1.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="py-1.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => startEdit(d)}
                        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        Update Logistics Status
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
