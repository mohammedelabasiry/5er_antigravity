'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HeartHandshake, ShieldAlert, User, ShieldCheck, Heart } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'DONOR' | 'BENEFICIARY' | 'CHARITY_ADMIN'>('DONOR');
  
  // Charity organization specific fields
  const [charityName, setCharityName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [charityPhone, setCharityPhone] = useState('');
  const [charityDescription, setCharityDescription] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync role choice from URL query parameter if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'BENEFICIARY') {
      setRole('BENEFICIARY');
    } else if (roleParam === 'CHARITY_ADMIN') {
      setRole('CHARITY_ADMIN');
    } else {
      setRole('DONOR');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        name,
        email,
        password,
        role,
      };

      if (role === 'CHARITY_ADMIN') {
        payload.charityName = charityName;
        payload.licenseNumber = licenseNumber;
        payload.charityPhone = charityPhone;
        payload.charityDescription = charityDescription;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      router.refresh();
      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 bg-slate-50/50">
      <div className="w-full max-w-lg bg-white border border-slate-100 shadow-xl shadow-slate-100 rounded-3xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-1">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-sm text-slate-500">Join the KhairLink Sadaqah Governance Platform</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-sm rounded-2xl flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('DONOR')}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              role === 'DONOR'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Donor
          </button>
          <button
            type="button"
            onClick={() => setRole('BENEFICIARY')}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              role === 'BENEFICIARY'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Beneficiary
          </button>
          <button
            type="button"
            onClick={() => setRole('CHARITY_ADMIN')}
            className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              role === 'CHARITY_ADMIN'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Charity
          </button>
        </div>

        {/* Helper info based on selected role */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl text-xs text-emerald-800 flex gap-2 items-center">
          {role === 'DONOR' && (
            <>
              <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>You will be able to browse needy families nearby, make contributions, and track receipts.</span>
            </>
          )}
          {role === 'BENEFICIARY' && (
            <>
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your profile remains 100% private. Donors see an anonymous code and display name only.</span>
            </>
          )}
          {role === 'CHARITY_ADMIN' && (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your account requires admin verification of license documents before you can log in fully.</span>
            </>
          )}
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Full Name / Representative Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Ali"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Choose Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
            />
          </div>

          {/* Charity-specific inputs */}
          {role === 'CHARITY_ADMIN' && (
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-700">Charity Organization Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                    Charity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={charityName}
                    onChange={(e) => setCharityName(e.target.value)}
                    placeholder="Resala Charity Association"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                    License Number / Reg ID
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="LIC-12345"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={charityPhone}
                  onChange={(e) => setCharityPhone(e.target.value)}
                  placeholder="+201012345678"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                  Brief Mission Description
                </label>
                <textarea
                  value={charityDescription}
                  onChange={(e) => setCharityDescription(e.target.value)}
                  placeholder="Describe your organization goals and main focus areas..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-slate-800 text-sm focus:outline-none transition-all resize-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl py-3 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-50">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Log in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
