'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Send, 
  ShieldAlert, 
  Lock, 
  User, 
  Building2, 
  Calendar,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface Conversation {
  id: string;
  beneficiaryProfileId: string;
  donorProfileId: string | null;
  charityProfileId: string | null;
  createdAt: string;
  updatedAt: string;
  beneficiaryProfile?: {
    code: string;
    displayName: string;
    category: string;
  };
  donorProfile?: {
    displayName: string;
  };
  charityProfile?: {
    charityName: string;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // App state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Status states
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  // 1. Load user profile on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/login'); // Or check endpoint
        // To be safe, we fetch user data from a public endpoint or try checking login status
        // A simple way to get session is calling GET /api/auth/login or similar, but let's just query db/session
        // Let's assume we can fetch it, if not, redirect to login
        const response = await fetch('/api/beneficiary/onboarding'); // Let's check session status
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        
        // Let's fetch conversations
        loadConversations();
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  // 2. Load conversations
  async function loadConversations(selectId?: string) {
    try {
      setLoadingConversations(true);
      const res = await fetch('/api/chat/conversation');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data);
      
      if (selectId) {
        const updatedSelected = data.find((c: any) => c.id === selectId);
        if (updatedSelected) setSelectedConversation(updatedSelected);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }

  // 3. Load messages when selectedConversation changes
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    
    async function loadMessages() {
      try {
        setLoadingMessages(true);
        const res = await fetch(`/api/chat/messages?conversationId=${selectedConversation!.id}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        if (isSubscribed) {
          setMessages(data);
          setErrorMsg(null);
        }
      } catch (err: any) {
        console.error(err);
        if (isSubscribed) {
          setErrorMsg('Could not retrieve messages');
        }
      } finally {
        if (isSubscribed) setLoadingMessages(false);
      }
    }

    loadMessages();

    // Set up polling for new messages every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${selectedConversation!.id}`);
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && data.length !== messages.length) {
            setMessages(data);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !inputText.trim() || sending) return;

    setSending(true);
    setErrorMsg(null);
    setSafetyNotice(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: inputText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400 && data.error.includes('blocked')) {
          setSafetyNotice(data.error);
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
      } else {
        // Clear input, append message, update conversation list
        setInputText('');
        setMessages((prev) => [...prev, data]);
        // Update last message in the left panel list
        setConversations((prev) => 
          prev.map((c) => 
            c.id === selectedConversation.id 
              ? { ...c, messages: [data], updatedAt: new Date().toISOString() } 
              : c
          )
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while sending');
    } finally {
      setSending(false);
    }
  };

  // Helper to get conversation display label based on role
  const getConversationLabel = (conv: Conversation) => {
    if (conv.beneficiaryProfile) {
      // Current user is donor or charity
      return {
        title: conv.beneficiaryProfile.displayName,
        subtitle: `Case: ${conv.beneficiaryProfile.code} (Cat ${conv.beneficiaryProfile.category})`,
        badge: 'Beneficiary'
      };
    } else {
      // Current user is beneficiary
      if (conv.donorProfile) {
        return {
          title: conv.donorProfile.displayName,
          subtitle: 'Private Supporter',
          badge: 'Donor'
        };
      } else if (conv.charityProfile) {
        return {
          title: conv.charityProfile.charityName,
          subtitle: 'Charity Representative',
          badge: 'Charity'
        };
      }
    }
    return { title: 'Direct Chat', subtitle: 'KhairLink User', badge: 'User' };
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden text-left">
      
      {/* 1. Conversations List Panel */}
      <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-full ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-slate-800 text-sm sm:text-base">Support Channels</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingConversations ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full"></div>
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs px-4">
              <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="font-bold mb-1">No chats active</p>
              <p className="text-[10px] text-slate-400 leading-normal">
                Donors or Charities can initiate secure chats from any beneficiary's public profile page.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const label = getConversationLabel(conv);
              const isSelected = selectedConversation?.id === conv.id;
              const lastMsg = conv.messages?.[0]?.content || 'Click to view conversation';
              const dateStr = conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : '';

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between space-y-1.5 hover:bg-slate-50/50 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{label.title}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{label.subtitle}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">{dateStr}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 font-medium italic">
                    {lastMsg}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Messages Panel */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        {selectedConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 text-sm">
                    {getConversationLabel(selectedConversation).title}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[8px] rounded-md uppercase">
                    {getConversationLabel(selectedConversation).badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {getConversationLabel(selectedConversation).subtitle}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Secure Shield Enabled</span>
              </div>
            </div>

            {/* Shield Alert Notice */}
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2.5 text-[10px] text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Privacy Governance:</span> Direct contact details (phones, emails, IDs) are programmatically redacted/blocked. Use this chat solely to coordinate logistical assistance, verification, or questions.
              </div>
            </div>

            {/* Error Message banner */}
            {errorMsg && (
              <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Safety Block Notice */}
            {safetyNotice && (
              <div className="bg-rose-100 border-b border-rose-200 px-4 py-2.5 flex items-start gap-2 text-xs text-rose-800 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{safetyNotice}</div>
              </div>
            )}

            {/* Messages Scroll Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full mb-1"></div>
                  <p className="text-xs">Fetching message logs...</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSystem = msg.senderId === 'SYSTEM';
                  const isMe = msg.senderId === currentUser?.id; // Fallback to sender name check if session not parsed

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-3 max-w-md text-[10px] text-slate-500 font-medium text-center space-y-1">
                          <p className="font-bold text-slate-600 text-left flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            {msg.senderName}
                          </p>
                          <p className="text-left">{msg.content}</p>
                        </div>
                      </div>
                    );
                  }

                  // Non-system messages
                  const alignment = msg.senderName === 'KhairLink Safety Bot' ? 'justify-center' : 'justify-start';
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${alignment}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl p-3 space-y-1.5 shadow-sm border ${
                        msg.senderName === 'KhairLink Safety Bot'
                          ? 'bg-slate-100 border-slate-200 text-slate-500 text-[10px]'
                          : 'bg-white border-slate-100 text-slate-800'
                      }`}>
                        <div className="flex justify-between items-center gap-4">
                          <span className="font-bold text-[9px] text-slate-500">
                            {msg.senderName}
                          </span>
                          <span className="text-[8px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your message securely..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl disabled:opacity-55 disabled:cursor-not-allowed shadow-md shadow-emerald-100 transition-all duration-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-600 text-sm">Select a Conversation</h3>
            <p className="text-xs text-slate-450 mt-1 max-w-sm text-center">
              Choose an active channel from the sidebar to chat securely.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
