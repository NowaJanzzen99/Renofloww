'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { AiMessage } from '@/types';

const MAX_FREE_CHATS = 5;

const placeholders = [
  'Maak een taak: tegels leggen in de badkamer',
  'Registreer €450 voor materiaal: vloertegels',
  'Zet een herinnering voor volgende week dinsdag',
  'Analyseer mijn budget en geef advies',
  'Welke aannemer heeft de laagste offerte?',
  'Wat kost een gemiddelde keukenrenovatie?',
];

const quickActions = [
  { icon: '✅', text: 'Maak een taak aan' },
  { icon: '💶', text: 'Registreer kosten' },
  { icon: '⏰', text: 'Zet een herinnering' },
  { icon: '📊', text: 'Analyseer mijn budget' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  toolExecuted?: boolean;
  created_at?: string;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  date: Date;
  messages: ChatMessage[];
}

function groupIntoSessions(messages: ChatMessage[]): ChatSession[] {
  if (messages.length === 0) return [];
  const sessions: ChatSession[] = [];
  let batch: ChatMessage[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prevTime = new Date(messages[i - 1].created_at || 0).getTime();
    const currTime = new Date(messages[i].created_at || 0).getTime();
    if (currTime - prevTime > 2 * 60 * 60 * 1000) {
      sessions.push(makeSession(batch));
      batch = [messages[i]];
    } else {
      batch.push(messages[i]);
    }
  }
  if (batch.length > 0) sessions.push(makeSession(batch));
  return sessions.reverse();
}

function makeSession(messages: ChatMessage[]): ChatSession {
  const firstUser = messages.find((m) => m.role === 'user');
  const last = messages[messages.length - 1];
  const raw = firstUser?.content || 'Gesprek';
  const title = raw.length > 50 ? raw.slice(0, 50) + '…' : raw;
  const previewRaw = last.content;
  const preview = previewRaw.length > 60 ? previewRaw.slice(0, 60) + '…' : previewRaw;
  return {
    id: messages[0].id,
    title,
    preview,
    date: new Date(messages[0].created_at || Date.now()),
    messages,
  };
}

function formatSessionDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Vandaag';
  if (diffDays === 1) return 'Gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c0 0 .9 5.2 3.2 7.6C17.5 12 23 12 23 12s-5.5 0-7.8 2.4C12.9 16.8 12 22 12 22s-.9-5.2-3.2-7.6C6.5 12 1 12 1 12s5.5 0 7.8-2.4C11.1 7.2 12 2 12 2z" />
    <path d="M19.5 3c0 0 .4 2.1 1.4 3.1 1 1 3.1 1.4 3.1 1.4s-2.1.4-3.1 1.4c-1 1-1.4 3.1-1.4 3.1s-.4-2.1-1.4-3.1C17.1 7.9 15 7.5 15 7.5s2.1-.4 3.1-1.4c1-1 1.4-3.1 1.4-3.1z" opacity="0.75" />
  </svg>
);

interface ChatSidebarProps {
  projectId?: string;
}

export default function ChatSidebar({ projectId }: ChatSidebarProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState(placeholders[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [isPro, setIsPro] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);
  const [userChatCount, setUserChatCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset to home view each time sidebar opens
  useEffect(() => {
    if (open) setView('home');
  }, [open]);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => {
        const next = (prev + 1) % placeholders.length;
        setPlaceholder(placeholders[next]);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Listen for open-ai-chat events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail;
      if (detail?.message) {
        setOpen(true);
        setMessages([]);
        setInput(detail.message);
        setView('chat');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('open-ai-chat', handler);
    return () => window.removeEventListener('open-ai-chat', handler);
  }, []);

  // Load user profile and message count
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsPro(!!profile.is_pro);
        if (!profile.is_pro) {
          if (profile.trial_ends_at) {
            setTrialExpired(new Date(profile.trial_ends_at) <= new Date());
          } else {
            setTrialExpired(true);
          }
          const { count } = await supabase
            .from('ai_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('role', 'user');
          setUserChatCount(count ?? 0);
        }
      }
    };
    loadUserData();
  }, []);

  // Load all messages and group into sessions when sidebar opens
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const query = supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(300);

      if (projectId) query.eq('project_id', projectId);

      const { data } = await query;
      if (data) {
        const all: ChatMessage[] = data.map((m: AiMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at,
        }));
        setSessions(groupIntoSessions(all));
      }
    };
    load();
    setHasUnread(false);
  }, [open, projectId]);

  // Scroll to bottom when messages change in chat view
  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const chatsRemaining = Math.max(0, MAX_FREE_CHATS - userChatCount);
  const chatLimitReached = !isPro && chatsRemaining === 0;
  const isBlocked = trialExpired || chatLimitReached;

  const startNewChat = () => {
    setMessages([]);
    setView('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startNewChatWithInput = (text: string) => {
    setMessages([]);
    setInput(text);
    setView('chat');
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const openSession = (session: ChatSession) => {
    setMessages(session.messages);
    setView('chat');
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || isBlocked) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (!isPro) setUserChatCount((prev) => prev + 1);

    const assistantMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '', created_at: new Date().toISOString() },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Verzoek mislukt');
      }

      const toolExecuted = response.headers.get('X-Tool-Executed') === 'true';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: fullContent, toolExecuted } : m
            )
          );
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Er is een fout opgetreden. Probeer het opnieuw.';
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMessageId ? { ...m, content: errMsg } : m))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @keyframes ai-ring {
          0%   { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        .ai-ring-1 { animation: ai-ring 3.5s cubic-bezier(0.4,0,0.6,1) infinite; }
        .ai-ring-2 { animation: ai-ring 3.5s cubic-bezier(0.4,0,0.6,1) 1.75s infinite; }
      `}</style>

      {/* Floating AI button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-16 h-16 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 z-40"
        style={{
          background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)',
          boxShadow: '0 6px 28px rgba(40,135,96,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        }}
        aria-label="AI Assistent openen"
      >
        <span className="ai-ring-1 absolute inset-0 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(40,135,96,0.35)' }} />
        <span className="ai-ring-2 absolute inset-0 rounded-full pointer-events-none" style={{ backgroundColor: 'rgba(40,135,96,0.2)' }} />
        <SparkleIcon className="w-7 h-7 relative z-10" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-white z-20" style={{ backgroundColor: '#EF4444' }} />
        )}
      </button>

      {/* Sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />

          <div className="relative w-full max-w-sm flex flex-col shadow-2xl" style={{ backgroundColor: '#FFFFFF', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}>

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: '#E5E7EB' }}>
              {view === 'chat' && (
                <button
                  onClick={() => setView('home')}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100 shrink-0"
                  style={{ color: '#6B7280' }}
                  aria-label="Terug naar overzicht"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)' }}>
                  <SparkleIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Renofloww AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                    <p className="text-xs" style={{ color: '#6B7280' }}>Altijd klaar om te helpen</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100 shrink-0"
                style={{ color: '#6B7280' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat limit bar */}
            {!isPro && !trialExpired && (
              <div className="px-4 py-2.5 border-b" style={{ borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>AI chats gebruikt</span>
                  <span className="text-xs font-bold" style={{ color: chatsRemaining === 0 ? '#EF4444' : chatsRemaining <= 2 ? '#F59E0B' : '#288760' }}>
                    {userChatCount}/{MAX_FREE_CHATS}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (userChatCount / MAX_FREE_CHATS) * 100)}%`,
                      backgroundColor: chatsRemaining === 0 ? '#EF4444' : chatsRemaining <= 2 ? '#F59E0B' : '#288760',
                    }}
                  />
                </div>
                {chatsRemaining > 0 && (
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                    Nog {chatsRemaining} {chatsRemaining === 1 ? 'chat' : 'chats'} in je proefperiode
                  </p>
                )}
              </div>
            )}

            {/* Blocked screens */}
            {isBlocked ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4" style={{ backgroundColor: '#F8FAF9' }}>
                <div className="text-4xl mb-4">{trialExpired ? '⏰' : '🚫'}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#1A1A1A' }}>
                  {trialExpired ? 'Proefperiode verlopen' : 'Chat limiet bereikt'}
                </h3>
                <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
                  {trialExpired
                    ? 'Je 14-daagse proefperiode is afgelopen. Upgrade naar Pro om de AI assistent te blijven gebruiken.'
                    : `Je hebt je ${MAX_FREE_CHATS} gratis AI chats gebruikt. Upgrade naar Pro voor onbeperkte chats.`}
                </p>
                <Link
                  href="/settings#abonnement"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: '#288760' }}
                >
                  Upgrade naar Pro
                </Link>
              </div>
            ) : view === 'home' ? (
              /* ── Home screen ── */
              <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F8FAF9' }}>
                {/* Hero */}
                <div className="px-4 pt-8 pb-5 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"
                    style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)', boxShadow: '0 4px 20px rgba(40,135,96,0.4)' }}
                  >
                    <SparkleIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>Hallo! Ik ben je AI bouw assistent.</p>
                  <p className="text-xs mb-5" style={{ color: '#6B7280' }}>Ik kan taken aanmaken, kosten registreren, herinneringen instellen én vragen beantwoorden.</p>
                  <button
                    onClick={startNewChat}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#288760' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nieuw gesprek starten
                  </button>
                </div>

                {/* Quick actions */}
                <div className="px-4 pb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Snelle acties</p>
                  <div className="grid gap-2">
                    {quickActions.map(({ icon, text }) => (
                      <button
                        key={text}
                        onClick={() => startNewChatWithInput(text)}
                        className="flex items-center gap-2 text-left px-3 py-2.5 rounded-xl text-xs border transition-colors hover:bg-white"
                        style={{ borderColor: '#E5E7EB', color: '#6B7280', backgroundColor: '#FFFFFF' }}
                      >
                        <span>{icon}</span>
                        {text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                {sessions.length > 0 && (
                  <div className="px-4 pb-8">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Recente gesprekken</p>
                    <div className="space-y-2">
                      {sessions.slice(0, 6).map((session) => (
                        <button
                          key={session.id}
                          onClick={() => openSession(session)}
                          className="w-full text-left px-3 py-3 rounded-xl border bg-white hover:bg-gray-50 transition-colors"
                          style={{ borderColor: '#E5E7EB' }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium truncate flex-1" style={{ color: '#1A1A1A' }}>{session.title}</p>
                            <span className="text-xs shrink-0 mt-0.5" style={{ color: '#D1D5DB' }}>{formatSessionDate(session.date)}</span>
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{session.preview}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Chat screen ── */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F8FAF9' }}>
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-3"
                        style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)', boxShadow: '0 4px 20px rgba(40,135,96,0.4)' }}
                      >
                        <SparkleIcon className="w-7 h-7" />
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>Wat kan ik voor je doen?</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>Stel een vraag of vraag me een actie uit te voeren.</p>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mr-2 mt-1"
                          style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)' }}
                        >
                          <SparkleIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className="max-w-xs rounded-2xl px-4 py-3 text-sm"
                        style={
                          msg.role === 'user'
                            ? { backgroundColor: '#288760', color: '#FFFFFF', borderBottomRightRadius: '4px' }
                            : { backgroundColor: '#FFFFFF', color: '#1A1A1A', borderBottomLeftRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                        }
                      >
                        {msg.content === '' && msg.role === 'assistant' ? (
                          <div className="flex gap-1 items-center py-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#9CA3AF', animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        ) : (
                          <>
                            {msg.toolExecuted && (
                              <div className="flex items-center gap-1 text-xs font-semibold mb-2 px-2 py-1 rounded-lg" style={{ backgroundColor: '#F0FDF4', color: '#15803D' }}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                ⚡ Actie uitgevoerd
                              </div>
                            )}
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="p-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                  <div className="flex items-end gap-2 rounded-xl border px-3 py-2" style={{ borderColor: '#E5E7EB' }}>
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      className="flex-1 resize-none text-sm outline-none bg-transparent"
                      style={{ color: '#1A1A1A', maxHeight: '120px' }}
                      disabled={loading}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-40 shrink-0"
                      style={{ backgroundColor: '#288760' }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-center" style={{ color: '#9CA3AF' }}>
                    Enter om te versturen · Shift+Enter voor nieuwe regel
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
