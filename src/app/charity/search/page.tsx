import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ArrowLeft, Search, Heart, ArrowRight, MapPin } from 'lucide-react';
import { BeneficiaryStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function CharitySearchPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'CHARITY_ADMIN') redirect('/');

  const beneficiaries = await prisma.beneficiaryProfile.findMany({
    where: { status: { in: [BeneficiaryStatus.APPROVED, BeneficiaryStatus.FULLY_SUPPORTED_THIS_MONTH] } },
    orderBy: { evaluationScore: 'desc' },
  });

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/charity/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-3">
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Search className="w-6 h-6" /></span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Beneficiary Search</h1>
            <p className="text-xs text-slate-500">Browse verified cases and coordinate support distribution</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficiaries.map(b => {
            const remaining = Math.max(0, b.monthlySupportCap - b.monthlyReceivedAmount);
            const progress = Math.min(100, Math.round((b.monthlyReceivedAmount / b.monthlySupportCap) * 100));
            return (
              <div key={b.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] font-bold text-slate-400">{b.code}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${b.status === 'FULLY_SUPPORTED_THIS_MONTH' ? 'bg-teal-50 text-teal-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {b.status === 'FULLY_SUPPORTED_THIS_MONTH' ? 'Supported' : `Cat ${b.category}`}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{b.displayName}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{b.areaName}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{b.caseSummary}</p>
                  <div className="space-y-1 pt-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Remaining:</span><span className="font-bold text-emerald-700">{remaining} EGP</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-emerald-600 h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                  </div>
                </div>
                <Link href={`/donor/beneficiary/${b.code}`} className="py-2 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1">
                  View & Contribute <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
