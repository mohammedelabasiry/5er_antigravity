import Link from 'next/link';
import { HeartHandshake, ShieldCheck, MapPin, BarChart3, Fingerprint, Coins, Award } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function getStats() {
  const totalBeneficiaries = await prisma.beneficiaryProfile.count({
    where: { status: { in: ['APPROVED', 'FULLY_SUPPORTED_THIS_MONTH'] } },
  });
  
  const fullySupported = await prisma.beneficiaryProfile.count({
    where: { status: 'FULLY_SUPPORTED_THIS_MONTH' },
  });

  const contributions = await prisma.contribution.findMany({
    where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
    select: { amount: true },
  });

  const totalDonated = contributions.reduce((sum, c) => sum + c.amount, 0);

  const totalCharities = await prisma.charityProfile.count({
    where: { isApproved: true },
  });

  return {
    totalBeneficiaries,
    fullySupported,
    totalDonated,
    totalCharities,
  };
}

export default async function LandingPage() {
  const stats = await getStats();
  const session = await getSession();

  return (
    <div className="flex-1 bg-gradient-to-b from-emerald-50/20 via-white to-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-100 animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5" />
                Next-Gen Charity Governance
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-none">
                Sadaqah, Managed with <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Dignity and Transparency
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl">
                KhairLink connects donors, charities, and beneficiaries in a unified ecosystem. 
                Our platform enforces monthly support caps, preserves beneficiary privacy, and provides 
                transparent audit logs to ensure aid goes to those who need it most.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                {session ? (
                  <Link
                    href={
                      session.role === 'ADMIN' || session.role === 'SUPER_ADMIN'
                        ? '/admin/dashboard'
                        : session.role === 'CHARITY_ADMIN'
                        ? '/charity/dashboard'
                        : session.role === 'DONOR'
                        ? '/donor/dashboard'
                        : '/beneficiary/dashboard'
                    }
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    Go to Your Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 hover:shadow-emerald-200 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      Start Helping Now
                    </Link>
                    <Link
                      href="/login"
                      className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm"
                    >
                      Log in to Platform
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Quick Summary Dashboard Image/Mockup */}
            <div className="mt-16 lg:mt-0 lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="absolute top-0 right-0 p-4 bg-emerald-500 text-white rounded-bl-3xl rounded-tr-3xl font-semibold text-xs tracking-wider uppercase">
                  Audited Live
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-4">
                  <BarChart3 className="text-emerald-600 w-5 h-5" />
                  Monthly Impact Ledger
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Total Aid Raised</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.totalDonated.toLocaleString()} EGP</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Verified Cases</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.totalBeneficiaries}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Fully Supported (Cap Met)</p>
                      <p className="text-lg font-bold text-emerald-700 mt-0.5">
                        {stats.totalBeneficiaries > 0 ? Math.round((stats.fullySupported / stats.totalBeneficiaries) * 100) : 0}% Cases
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 flex items-center justify-center font-bold text-xs text-slate-700">
                      {stats.fullySupported}/{stats.totalBeneficiaries}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100/50">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Active Charities
                    </span>
                    <span>{stats.totalCharities} Registered</span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    All numbers reflect real-time distribution audits checked on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governance Values Section */}
      <section className="py-20 bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              A Higher Standard of Governance
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Conventional charity methods can lead to coordination gaps and support duplication. 
              Here is how KhairLink establishes a transparent framework:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Privacy & Dignity First</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                We never expose legal names, national IDs, or sensitive medical files to the public. 
                Donors see anonymized codes and respectful summaries, protecting beneficiary pride.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Enforced Support Caps</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                By setting custom monthly caps based on verified evaluations, we prevent cases 
                from being overfunded while others receive nothing. Resources are allocated fairly.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl space-y-4 hover:border-emerald-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-600/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Traceable Audit Logs</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Every login, document review, and resource delivery is recorded on a permanent audit 
                trail. Admins and charities operate with absolute accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Navigation Block */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            How Do You Want to Participate?
          </h2>
          <p className="text-slate-600">
            Select your profile type to register or learn how you fit into the governance system.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {/* Donors Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">For Donors</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Browse verified, anonymized needy cases near your neighborhood on a beautiful visual map. 
                Provide monthly cash support or coordinate resource distributions directly.
              </p>
            </div>
            <Link
              href="/register?role=DONOR"
              className="mt-8 block text-center px-4 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors"
            >
              Register as Donor
            </Link>
          </div>

          {/* Beneficiary Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">For Beneficiaries</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Register securely, fill our onboarding needs assessment, and upload required documents. 
                Once approved, receive transparent support from individual donors and registered organizations.
              </p>
            </div>
            <Link
              href="/register?role=BENEFICIARY"
              className="mt-8 block text-center px-4 py-2.5 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors"
            >
              Apply for Support
            </Link>
          </div>

          {/* Charity Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">For Charity Organizations</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Coordinate with other charities to prevent duplication. View verified cases, manage campaigns, 
                and report resource deliveries directly. Full Super Admin oversight ensures integrity.
              </p>
            </div>
            <Link
              href="/register?role=CHARITY_ADMIN"
              className="mt-8 block text-center px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Register Organization
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
