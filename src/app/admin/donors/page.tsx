import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { translations } from '@/lib/LanguageContext';
import { ArrowLeft, Users } from 'lucide-react';
import DonorList from './DonorList';

export const dynamic = 'force-dynamic';

async function getDonors() {
  const donors = await prisma.donorProfile.findMany({
    include: {
      user: {
        select: {
          email: true,
          isBlocked: true,
          createdAt: true,
        },
      },
      contributions: {
        where: { status: { in: ['CONFIRMED', 'DELIVERED'] } },
        select: { amount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return donors.map((d) => {
    const totalDonated = d.contributions.reduce((sum, c) => sum + c.amount, 0);
    return {
      id: d.id,
      userId: d.userId,
      displayName: d.displayName,
      phone: d.phone,
      bio: d.bio,
      email: d.user.email,
      isBlocked: d.user.isBlocked,
      createdAt: d.createdAt,
      donationsCount: d.contributions.length,
      totalDonated,
    };
  });
}

export default async function AdminDonorsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const donors = await getDonors();

  const cookieStore = await cookies();
  const lang = (cookieStore.get('language')?.value || 'en') as 'en' | 'ar';
  const isRtl = lang === 'ar';
  const t = (key: keyof typeof translations['en']): string => {
    return translations[lang]?.[key] || translations['en'][key] || String(key);
  };

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          href="/admin/dashboard"
          className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          {t('backToAdminDashboard')}
        </Link>

        {/* Header */}
        <div className={`bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </span>
          <div className={isRtl ? 'text-right' : ''}>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('donorsDirectory')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('donorsDirectoryDesc')}
            </p>
          </div>
        </div>

        {/* Interactive Donor List */}
        <DonorList initialDonors={donors} lang={lang} />
      </div>
    </div>
  );
}
