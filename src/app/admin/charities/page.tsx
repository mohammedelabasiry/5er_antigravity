import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { translations } from '@/lib/translations';
import { ArrowLeft, Building } from 'lucide-react';
import CharityList from './CharityList';

export const dynamic = 'force-dynamic';

async function getCharities() {
  return prisma.charityProfile.findMany({
    include: {
      user: { select: { email: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function AdminCharitiesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const charities = await getCharities();

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
            <Building className="w-6 h-6" />
          </span>
          <div className={isRtl ? 'text-right' : ''}>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {t('charitiesDirectory')}
            </h1>
            <p className="text-xs text-slate-500">
              {t('charitiesDirectoryDesc')}
            </p>
          </div>
        </div>

        {/* Interactive Charity List */}
        <CharityList initialCharities={charities} lang={lang} />
      </div>
    </div>
  );
}
