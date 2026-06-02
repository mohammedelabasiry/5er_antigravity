'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from '@/lib/LanguageContext';

interface ChatButtonProps {
  beneficiaryProfileId: string;
}

export default function ChatButton({ beneficiaryProfileId }: ChatButtonProps) {
  const router = useRouter();
  const { t, isRtl } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryProfileId }),
      });

      const data = await response.json();
      if (response.ok && data.conversationId) {
        router.refresh();
        router.push(`/chat?id=${data.conversationId}`);
      } else {
        alert(data.error || (isRtl ? 'فشل بدء جلسة المحادثة.' : 'Failed to start chat session.'));
      }
    } catch (e) {
      console.error(e);
      alert(isRtl ? 'خطأ أثناء فتح المحادثة.' : 'Error opening chat conversation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className={`px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <MessageSquare className="w-4 h-4" />
      )}
      {t('openChat')}
    </button>
  );
}
