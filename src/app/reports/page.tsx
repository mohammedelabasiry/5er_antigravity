import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Activity, 
  Terminal, 
  Coins, 
  Package, 
  TrendingUp,
  FileText
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getReportData(session: { userId: string; role: string }) {
  const { userId, role } = session;

  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;

  // 1. Fetch Audit Logs
  const auditLogs = await prisma.auditLog.findMany({
    where: isAdmin ? {} : { userId },
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // 2. Aggregate counts
  const totalBeneficiaries = await prisma.beneficiaryProfile.count();
  const approvedBeneficiaries = await prisma.beneficiaryProfile.count({
    where: { status: 'APPROVED' },
  });

  const contributionStats = await prisma.contribution.aggregate({
    _sum: { amount: true },
    _count: true,
  });

  const resourceStats = await prisma.resourceDistribution.aggregate({
    _sum: { estimatedValue: true },
    _count: true,
  });

  // 3. Category distribution
  const categoriesRaw = await prisma.beneficiaryProfile.groupBy({
    by: ['category'],
    _count: {
      _all: true,
    },
  });

  const categories = { A: 0, B: 0, C: 0, D: 0 } as Record<string, number>;
  categoriesRaw.forEach((c) => {
    if (c.category in categories) {
      categories[c.category] = c._count._all;
    }
  });

  return {
    auditLogs,
    metrics: {
      totalBeneficiaries,
      approvedBeneficiaries,
      totalDonationsAmount: contributionStats._sum.amount || 0,
      totalDonationsCount: contributionStats._count || 0,
      totalResourcesValue: resourceStats._sum.estimatedValue || 0,
      totalResourcesCount: resourceStats._count || 0,
    },
    categories,
  };
}

export default async function ReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Authorize: Admin or Charity admin
  const isAuthorized = 
    session.role === Role.ADMIN || 
    session.role === Role.SUPER_ADMIN || 
    session.role === Role.CHARITY_ADMIN;

  if (!isAuthorized) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-8 text-left">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md shadow-sm space-y-4 text-center">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Access Restricted</h3>
          <p className="text-xs text-slate-550 leading-relaxed">
            Only verified administrators or registered charity officers have clearance to review the platform's audit ledger and reports.
          </p>
        </div>
      </div>
    );
  }

  const { auditLogs, metrics, categories } = await getReportData(session);

  return (
    <div className="flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Platform Governance Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Audit Logs & Analytics
            </h1>
            <p className="text-xs text-slate-400">
              {session.role === Role.CHARITY_ADMIN 
                ? 'Reviewing activity logs and support analytics for your organization.' 
                : 'Supervising platform-wide donation routing, support caps, and system audit logs.'}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Approved Beneficiaries */}
          <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <Users className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Beneficiary Reach</span>
            </div>
            <p className="text-3xl font-bold text-slate-950">
              {metrics.approvedBeneficiaries} <span className="text-xs text-slate-400 font-medium">/ {metrics.totalBeneficiaries}</span>
            </p>
            <p className="text-xs text-slate-500 font-semibold">Approved active support cases</p>
          </div>

          {/* Cash Contributions */}
          <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash Support Ledger</span>
            </div>
            <p className="text-3xl font-bold text-slate-950">
              {metrics.totalDonationsAmount.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">EGP</span>
            </p>
            <p className="text-xs text-slate-500 font-semibold">{metrics.totalDonationsCount} direct donations processed</p>
          </div>

          {/* Resource Logistics */}
          <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <Package className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Physical Aid value</span>
            </div>
            <p className="text-3xl font-bold text-slate-950">
              {metrics.totalResourcesValue.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">EGP</span>
            </p>
            <p className="text-xs text-slate-500 font-semibold">{metrics.totalResourcesCount} supply distributions completed</p>
          </div>

          {/* Total Transacted aid */}
          <div className="bg-gradient-to-tr from-slate-900 to-emerald-950 text-white p-5 rounded-3xl shadow-md space-y-2">
            <div className="flex justify-between items-center text-emerald-450">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Aid Value Routed</span>
            </div>
            <p className="text-3xl font-black">
              {(metrics.totalDonationsAmount + metrics.totalResourcesValue).toLocaleString()} <span className="text-xs text-emerald-300 font-bold">EGP</span>
            </p>
            <p className="text-xs text-emerald-250">Direct support and logistics value</p>
          </div>
        </div>

        {/* Visual Charts & Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Vulnerability Category breakdown */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
              <BarChart3 className="text-emerald-600 w-5 h-5" />
              Vulnerability Category Ratio
            </h3>
            
            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map((cat) => {
                const count = categories[cat] || 0;
                const total = metrics.totalBeneficiaries || 1;
                const percent = Math.round((count / total) * 100);
                
                let colorClass = 'bg-rose-500';
                if (cat === 'B') colorClass = 'bg-amber-500';
                if (cat === 'C') colorClass = 'bg-blue-500';
                if (cat === 'D') colorClass = 'bg-emerald-500';

                return (
                  <div key={cat} className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-700 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                        Category {cat} ({cat === 'A' ? 'Critical' : cat === 'B' ? 'High' : cat === 'C' ? 'Medium' : 'Low'})
                      </span>
                      <span className="font-bold text-slate-900">{count} cases ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl text-[10px] text-slate-500 leading-normal font-medium border border-slate-100">
              <span className="font-bold text-slate-750 block uppercase mb-1">Scoring Definition:</span>
              Category scores are calculated dynamically from family status, income level, debts, health issues, and housing conditions.
            </div>
          </div>

          {/* Chronological Audit Logs */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 overflow-hidden">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-50 pb-3">
                <Terminal className="text-slate-650 w-5 h-5" />
                Governance Audit Trail (Latest 50 actions)
              </h3>

              <div className="overflow-x-auto mt-4 max-h-[400px] overflow-y-auto pr-1">
                <table className="w-full text-[11px] text-slate-600 text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-450 uppercase font-bold text-[9px] tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-2 bg-slate-50/80">Timestamp</th>
                      <th className="px-4 py-2 bg-slate-50/80">Action Event</th>
                      <th className="px-4 py-2 bg-slate-50/80">Operator</th>
                      <th className="px-4 py-2 bg-slate-50/80">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-55">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-405">
                          No audit logs found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-55/30 transition-colors">
                          {/* Time */}
                          <td className="px-4 py-2.5 font-mono text-[9px] text-slate-400 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          {/* Action */}
                          <td className="px-4 py-2.5 font-bold text-slate-850 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-650">
                              {log.action}
                            </span>
                          </td>
                          {/* User */}
                          <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">
                            {log.user ? (
                              <div className="space-y-0.5">
                                <span className="block">{log.user.name}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                                  {log.user.role}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Anonymous</span>
                            )}
                          </td>
                          {/* Details */}
                          <td className="px-4 py-2.5 font-medium text-slate-600 max-w-xs truncate font-mono text-[10px]" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
