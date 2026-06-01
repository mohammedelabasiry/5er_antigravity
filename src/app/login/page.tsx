'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeartHandshake, ShieldAlert, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign in. Please check your credentials.');
      }

      router.refresh();
      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 bg-slate-50/50">
      <div className="w-full max-w-md bg-white border border-slate-100 shadow-xl shadow-slate-100 rounded-3xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-1">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-sm text-slate-500">Log in to the Sadaqah Governance Platform</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-sm rounded-2xl flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.org"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-slate-800 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-11 pr-4 text-slate-800 text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold rounded-xl py-3 shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Access Account'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-50">
          <p className="text-sm text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Seed Credentials Quick Guide */}
      <div className="mt-8 w-full max-w-md bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-emerald-800 flex items-center gap-1">
          Demo Credentials (Password: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">password123</code>)
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Super Admin:</strong> <code className="font-mono">admin@khairlink.org</code></li>
          <li><strong>Donor:</strong> <code className="font-mono">donor1@gmail.com</code> (Sadaqah Giver)</li>
          <li><strong>Charity:</strong> <code className="font-mono">charity1@charity.org</code> (Resala Association)</li>
          <li><strong>Beneficiary (Approved):</strong> <code className="font-mono">ben2@gmail.com</code> (Widow Case)</li>
          <li><strong>Beneficiary (Onboarding Pending):</strong> <code className="font-mono">ben5@gmail.com</code></li>
        </ul>
      </div>
    </div>
  );
}
