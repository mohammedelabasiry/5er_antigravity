'use client';

import { useState } from 'react';
import { UserCheck, UserX, Phone, Mail, Coins, Calendar } from 'lucide-react';

interface Donor {
  id: string;
  userId: string;
  displayName: string;
  phone: string | null;
  bio: string | null;
  email: string;
  isBlocked: boolean;
  createdAt: Date;
  donationsCount: number;
  totalDonated: number;
}

interface DonorListProps {
  initialDonors: Donor[];
}

export default function DonorList({ initialDonors }: DonorListProps) {
  const [donors, setDonors] = useState<Donor[]>(initialDonors);
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      const response = await fetch(`/api/admin/user/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !currentStatus }),
      });

      if (response.ok) {
        setDonors((prev) =>
          prev.map((d) => (d.userId === userId ? { ...d, isBlocked: !currentStatus } : d))
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update donor access state.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error updating user block status');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredDonors = donors.filter(
    (d) =>
      d.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* Search Bar */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search donors by name or email address..."
          className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-2.5 px-4 text-slate-800 text-sm focus:outline-none transition-all"
        />
      </div>

      {/* Donor list grid */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
          No donors match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDonors.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      {d.displayName}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: {d.id.substring(0, 8)}...</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      d.isBlocked
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {d.isBlocked ? 'Suspended' : 'Active'}
                  </span>
                </div>

                {d.bio && <p className="text-xs text-slate-500 italic">"{d.bio}"</p>}

                {/* Donation Metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                  <div className="text-xs">
                    <p className="text-[10px] text-slate-400">Total Donated</p>
                    <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      {d.totalDonated.toLocaleString()} EGP
                    </p>
                  </div>
                  <div className="text-xs">
                    <p className="text-[10px] text-slate-400">Contributions</p>
                    <p className="font-bold text-slate-850 mt-0.5">
                      {d.donationsCount} confirmed
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 text-xs border-t border-slate-50">
                  <p className="flex items-center gap-1.5 text-slate-650">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {d.email}
                  </p>
                  {d.phone && (
                    <p className="flex items-center gap-1.5 text-slate-650">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {d.phone}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-350" />
                    Joined: {new Date(d.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleToggleBlock(d.userId, d.isBlocked)}
                  disabled={togglingId === d.userId}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                    d.isBlocked
                      ? 'bg-emerald-55 hover:bg-emerald-50 text-emerald-700 border border-emerald-150'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150'
                  }`}
                >
                  {togglingId === d.userId ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  ) : d.isBlocked ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      Reactivate Account
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      Suspend Donor
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
