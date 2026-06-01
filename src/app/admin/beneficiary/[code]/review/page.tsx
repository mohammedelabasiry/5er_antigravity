import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ShieldAlert,
  ArrowLeft,
  FileText,
  User,
  Activity,
  DollarSign,
  Download,
  CheckCircle,
  XCircle,
  Unlock,
} from 'lucide-react';
import ReviewForm from './ReviewForm';

export const dynamic = 'force-dynamic';

async function getBeneficiaryReviewData(code: string) {
  const profile = await prisma.beneficiaryProfile.findUnique({
    where: { code },
    include: {
      user: { select: { email: true } },
      documents: true,
      evaluations: { orderBy: { createdAt: 'desc' } },
      adminNotes: { orderBy: { createdAt: 'desc' } },
    },
  });

  return profile;
}

export default async function BeneficiaryReviewPage(
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const profile = await getBeneficiaryReviewData(params.code);

  if (!profile) {
    return (
      <div className="flex-1 p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Case profile not found</h2>
          <p className="text-slate-500 text-sm">
            The code `{params.code}` is not registered in the governance system.
          </p>
          <Link href="/admin/dashboard" className="text-emerald-600 font-bold hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>

        {/* Header Summary */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase rounded border border-amber-200">
              Audit Pending
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Review: {profile.fullName}
            </h1>
            <p className="text-xs text-slate-400 font-mono">Case Code: {profile.code}</p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Algorithmic Assessment</p>
            <p className="text-lg font-bold text-slate-800">
              Category {profile.category} (Score {profile.evaluationScore})
            </p>
            <p className="text-xs text-slate-500">Recommended: {profile.monthlySupportCap} EGP</p>
          </div>
        </div>

        {/* Main Review Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Detailed Info Column */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Needs Summary */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <Activity className="text-emerald-600 w-4 h-4" />
                Case Summary & Public Profile
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Display Name</p>
                  <p className="text-sm font-semibold text-slate-700">{profile.displayName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Case Story / Summary</p>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {profile.caseSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Legal Private Verification */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <User className="text-emerald-600 w-4 h-4" />
                Confidential Legal Profile (Admin Only)
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Legal Name</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">National ID</p>
                  <p className="font-semibold text-slate-850 font-mono mt-0.5">{profile.nationalId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Contact Phone</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Home Address</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.address}</p>
                </div>
              </div>
            </div>

            {/* Financial Need Factors */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <DollarSign className="text-emerald-600 w-4 h-4" />
                Socio-Economic Evaluation Metrics
              </h3>

              <div className="grid grid-cols-3 gap-4 text-xs border-b border-slate-50 pb-4">
                <div>
                  <p className="text-[10px] text-slate-400">Monthly Income</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.monthlyIncome} EGP</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Dependents</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.familyMembersCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Children under 18</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{profile.childrenCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <p className="text-[10px] text-slate-400">Employment</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.employmentStatus}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Housing Tenure</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.housingStatus}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Monthly Support Received</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{profile.existingSupport} EGP</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400">Outstanding Debts</p>
                  <p className="font-semibold text-rose-700 mt-0.5">{profile.debtObligations} EGP</p>
                </div>
              </div>

              {profile.medicalConditions && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mt-2">
                  <p className="font-bold text-slate-700">Chronic Illnesses / Medical State:</p>
                  <p className="text-slate-650 mt-1">{profile.medicalConditions}</p>
                </div>
              )}
            </div>

            {/* Document verification files */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-2">
                <FileText className="text-emerald-600 w-4 h-4" />
                Submitted Verification Documents
              </h3>

              <div className="space-y-3">
                {profile.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-700">{doc.documentType.replace('_', ' ')}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{doc.fileName}</p>
                    </div>

                    <a
                      href={`/api/admin/documents/${doc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 rounded-xl font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Scan
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Action Column (Right 5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <ReviewForm
                profileId={profile.id}
                initialCap={profile.monthlySupportCap}
                initialCategory={profile.category}
                adminNotesHistory={profile.adminNotes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
