'use client';

import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">KhairLink</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">{t('footerHome')}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t('footerAbout')}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t('footerPrivacy')}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t('footerTerms')}</Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 text-xs">
          <p>&copy; {new Date().getFullYear()} {t('footerCopyright')}</p>
          <p className="text-slate-500">{t('footerVersion')}</p>
        </div>
      </div>
    </footer>
  );
}
