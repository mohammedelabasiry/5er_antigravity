'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/LanguageContext';
import { 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  Send, 
  Clock, 
  User, 
  Tag, 
  Filter,
  AlertCircle,
  HelpCircle,
  Activity
} from 'lucide-react';

interface Ticket {
  id: string;
  userId: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface TicketsClientPageProps {
  initialTickets: Ticket[];
  userRole: string;
}

export default function TicketsClientPage({ initialTickets, userRole }: TicketsClientPageProps) {
  const { t, language } = useTranslation();
  const isRtl = language === 'ar';
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(isAdmin ? 'list' : 'create');
  
  // Submit ticket form state
  const [ticketType, setTicketType] = useState('COMPLAINT');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Admin response state
  const [adminReplies, setAdminReplies] = useState<{ [ticketId: string]: string }>({});
  const [adminStatuses, setAdminStatuses] = useState<{ [ticketId: string]: string }>({});

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering tickets
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg(isRtl ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill out all required fields');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: ticketType,
          subject,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setSuccessMsg(t('ticketSuccess'));
      setSubject('');
      setMessage('');
      
      // Fetch latest tickets list
      const listRes = await fetch('/api/tickets');
      const listData = await listRes.json();
      if (listRes.ok) {
        setTickets(listData.tickets);
      }
      
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMsg('');
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string) => {
    const status = adminStatuses[ticketId];
    const adminReply = adminReplies[ticketId];

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ticketId,
          status,
          adminReply,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update ticket');
      }

      // Fetch latest tickets list
      const listRes = await fetch('/api/tickets');
      const listData = await listRes.json();
      if (listRes.ok) {
        setTickets(listData.tickets);
      }

      setSuccessMsg(isRtl ? 'تم تحديث التذكرة بنجاح!' : 'Ticket updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
            <Clock className="w-3 h-3" />
            {t('statusOpen')}
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
            <Activity className="w-3 h-3" />
            {t('statusInReview')}
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
            <CheckCircle className="w-3 h-3" />
            {t('statusResolved')}
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-650 text-xs font-bold rounded-full border border-slate-200">
            <AlertCircle className="w-3 h-3" />
            {t('statusClosed')}
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPLAINT':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'SUGGESTION':
        return <HelpCircle className="w-4 h-4 text-emerald-500" />;
      case 'BUG_REPORT':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'COMPLAINT':
        return t('typeComplaint');
      case 'SUGGESTION':
        return t('typeSuggestion');
      case 'BUG_REPORT':
        return t('typeBug');
      default:
        return type;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const typeMatch = filterType === 'ALL' || ticket.type === filterType;
    const statusMatch = filterStatus === 'ALL' || ticket.status === filterStatus;
    return typeMatch && statusMatch;
  });

  return (
    <div className={`flex-1 bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 sm:p-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('ticketsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            {t('ticketsSubtitle')}
          </p>
        </div>

        {/* Action tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('create')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all duration-300 ${
                activeTab === 'create'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              {t('newTicket')}
            </button>
          )}
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all duration-300 ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            {isAdmin ? t('allTickets') : t('myTickets')}
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'create' && !isAdmin && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <form onSubmit={handleCreateTicket} className="space-y-5">
              
              {/* Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('ticketType')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'COMPLAINT', label: t('typeComplaint'), bg: 'hover:border-rose-300 selected:bg-rose-50 border-rose-100' },
                    { val: 'SUGGESTION', label: t('typeSuggestion'), bg: 'hover:border-emerald-300 selected:bg-emerald-50 border-emerald-100' },
                    { val: 'BUG_REPORT', label: t('typeBug'), bg: 'hover:border-amber-300 selected:bg-amber-50 border-amber-100' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setTicketType(item.val)}
                      className={`p-3 text-center border-2 rounded-2xl text-xs font-bold transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                        ticketType === item.val
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                          : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {getTypeIcon(item.val)}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('ticketSubject')}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={isRtl ? 'مثال: مشكلة في استلام الدعم المالي' : 'e.g. Issue receiving cash support'}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('ticketMessage')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isRtl ? 'اكتب تفاصيل شكواك أو اقتراحك هنا بشكل كامل لتسريع عملية المراجعة...' : 'Write your full feedback details here to help us investigate efficiently...'}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {t('submitTicket')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-6">
            
            {/* Filter controls */}
            <div className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between text-xs text-slate-500 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>{isRtl ? 'فلترة التذاكر:' : 'Filter Tickets:'}</span>
              </div>
              <div className={`flex gap-3 w-full sm:w-auto ${isRtl ? 'flex-row-reverse' : ''}`}>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="ALL">{isRtl ? 'جميع الأنواع' : 'All Types'}</option>
                  <option value="COMPLAINT">{t('typeComplaint')}</option>
                  <option value="SUGGESTION">{t('typeSuggestion')}</option>
                  <option value="BUG_REPORT">{t('typeBug')}</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="ALL">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="OPEN">{t('statusOpen')}</option>
                  <option value="IN_REVIEW">{t('statusInReview')}</option>
                  <option value="RESOLVED">{t('statusResolved')}</option>
                  <option value="CLOSED">{t('statusClosed')}</option>
                </select>
              </div>
            </div>

            {/* Tickets Grid */}
            {filteredTickets.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="text-xs">{t('noTickets')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTickets.map((ticket) => {
                  const replyText = adminReplies[ticket.id] !== undefined ? adminReplies[ticket.id] : (ticket.adminReply || '');
                  const currentStatus = adminStatuses[ticket.id] !== undefined ? adminStatuses[ticket.id] : ticket.status;

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      {/* Ticket Header */}
                      <div className={`flex justify-between items-start gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="space-y-1">
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                              {getTypeIcon(ticket.type)}
                            </span>
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                              {getTypeLabel(ticket.type)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{ticket.id.slice(0, 8)}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {ticket.subject}
                          </h3>
                          <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Clock className="w-3 h-3" />
                            <span>{new Date(ticket.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}</span>
                            {ticket.user && (
                              <>
                                <span>•</span>
                                <User className="w-3 h-3" />
                                <span className="font-semibold">{ticket.user.name} ({ticket.user.role.toLowerCase()})</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>

                      {/* Ticket Message Body */}
                      <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-4 text-xs font-medium text-slate-750 whitespace-pre-wrap leading-relaxed">
                        {ticket.message}
                      </div>

                      {/* Admin Reply or Submission Info */}
                      {ticket.adminReply ? (
                        <div className={`bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 space-y-2 ${isRtl ? 'border-r-4 border-r-emerald-500' : 'border-l-4 border-l-emerald-500'}`}>
                          <h4 className={`font-bold text-emerald-800 text-[11px] flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {t('ticketAdminReply')}
                          </h4>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {ticket.adminReply}
                          </p>
                        </div>
                      ) : (
                        !isAdmin && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            {isRtl ? '* في انتظار مراجعة مسؤول النظام للرد والحل.' : '* Awaiting system administrator review and resolution.'}
                          </p>
                        )
                      )}

                      {/* Admin controls section */}
                      {isAdmin && (
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                          <h4 className={`font-bold text-slate-800 text-xs uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                            {isRtl ? 'الإجراء الإداري:' : 'Administrative Action:'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            
                            {/* Status field */}
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {isRtl ? 'تحديث الحالة' : 'Update Status'}
                              </label>
                              <select
                                value={currentStatus}
                                onChange={(e) => setAdminStatuses({ ...adminStatuses, [ticket.id]: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                              >
                                <option value="OPEN">{t('statusOpen')}</option>
                                <option value="IN_REVIEW">{t('statusInReview')}</option>
                                <option value="RESOLVED">{t('statusResolved')}</option>
                                <option value="CLOSED">{t('statusClosed')}</option>
                              </select>
                            </div>

                            {/* Reply Input */}
                            <div className="md:col-span-6 space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {isRtl ? 'صيغة الرد' : 'Reply Message'}
                              </label>
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setAdminReplies({ ...adminReplies, [ticket.id]: e.target.value })}
                                placeholder={t('replyPlaceholder')}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                              />
                            </div>

                            {/* Submit Reply Button */}
                            <div className="md:col-span-3">
                              <button
                                onClick={() => handleUpdateTicket(ticket.id)}
                                disabled={submitting}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                {isRtl ? 'حفظ وإرسال' : 'Save & Send'}
                              </button>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
