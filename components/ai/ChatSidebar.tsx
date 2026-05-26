'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { AiMessage } from '@/types';

const MAX_FREE_CHATS = 5;

const placeholders = [
  'Wat kost een gemiddelde badkamer verbouwing?',
  'Heb ik een vergunning nodig voor een dakkapel?',
  'Analyseer mijn budget',
  'Welke aannemer heeft de laagste offerte?',
  'Maak een herinnering voor volgende week',
  'Hoeveel heb ik al uitgegeven aan materialen?',
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface ChatSidebarProps {
  projectId?: string;
}

export default function ChatSidebar({ projectId }: ChatSidebarProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [placeholder, setPlaceholder] = useState(placeholders[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);
  const [isPro, setIsPro] = useState(true); // default true until loaded
  const [trialExpired, setTrialExpired] = useState(false);
  const [userChatCount, setUserChatCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Load user profile and message count
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsPro(!!profile.is_pro);
        if (!profile.is_pro) {
          // Check trial expiry
          if (profile.trial_ends_at) {
            const expired = new Date(profile.trial_ends_at) <= new Date();
            setTrialExpired(expired);
          } else {
            // No trial_ends_at → treat as expired
            setTrialExpired(true);
          }
          // Count user messages sent
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

  // Load previous messages
  useEffect(() => {
    if (!open) return;
    const loadMessages = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const query = supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (projectId) {
        query.eq('project_id', projectId);
      }

      const { data } = await query;
      if (data) {
        setMessages(
          data.map((m: AiMessage) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      }
    };
    loadMessages();
    setHasUnread(false);
  }, [open, projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatsRemaining = Math.max(0, MAX_FREE_CHATS - userChatCount);
  const chatLimitReached = !isPro && chatsRemaining === 0;
  const isBlocked = trialExpired || chatLimitReached;

  const sendMessage = async () => {
    if (!input.trim() || loading || isBlocked) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Optimistically increment counter for free users
    if (!isPro) {
      setUserChatCount((prev) => prev + 1);
    }

    const assistantMessageId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: 'assistant', content: '' },
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
        throw new Error('Verzoek mislukt');
      }

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
              m.id === assistantMessageId ? { ...m, content: fullContent } : m
            )
          );
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: 'Er is een fout opgetreden. Probeer het opnieuw.' }
            : m
        )
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
      {/* Keyframes for the slow AI pulse rings */}
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
        {/* Slow pulse rings */}
        <span
          className="ai-ring-1 absolute inset-0 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(40,135,96,0.35)' }}
        />
        <span
          className="ai-ring-2 absolute inset-0 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(40,135,96,0.2)' }}
        />

        {/* AI sparkle icon */}
        <svg className="w-7 h-7 relative z-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c0 0 .9 5.2 3.2 7.6C17.5 12 23 12 23 12s-5.5 0-7.8 2.4C12.9 16.8 12 22 12 22s-.9-5.2-3.2-7.6C6.5 12 1 12 1 12s5.5 0 7.8-2.4C11.1 7.2 12 2 12 2z" />
          <path d="M19.5 3c0 0 .4 2.1 1.4 3.1 1 1 3.1 1.4 3.1 1.4s-2.1.4-3.1 1.4c-1 1-1.4 3.1-1.4 3.1s-.4-2.1-1.4-3.1C17.1 7.9 15 7.5 15 7.5s2.1-.4 3.1-1.4c1-1 1.4-3.1 1.4-3.1z" opacity="0.75" />
        </svg>

        {hasUnread && (
          <span
            className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-white z-20"
            style={{ backgroundColor: '#EF4444' }}
          />
        )}
      </button>

      {/* Sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={() => setOpen(false)}
          />

          {/* Chat panel */}
          <div
            className="relative w-full max-w-sm flex flex-col shadow-2xl"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2c0 0 .9 5.2 3.2 7.6C17.5 12 23 12 23 12s-5.5 0-7.8 2.4C12.9 16.8 12 22 12 22s-.9-5.2-3.2-7.6C6.5 12 1 12 1 12s5.5 0 7.8-2.4C11.1 7.2 12 2 12 2z" />
                    <path d="M19.5 3c0 0 .4 2.1 1.4 3.1 1 1 3.1 1.4 3.1 1.4s-2.1.4-3.1 1.4c-1 1-1.4 3.1-1.4 3.1s-.4-2.1-1.4-3.1C17.1 7.9 15 7.5 15 7.5s2.1-.4 3.1-1.4c1-1 1.4-3.1 1.4-3.1z" opacity="0.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Renofloww AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                    <p className="text-xs" style={{ color: '#6B7280' }}>Altijd klaar om te helpen</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ color: '#6B7280' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat limit bar (only for free trial users) */}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F8FAF9' }}>

              {/* Trial expired block */}
              {trialExpired && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="text-4xl mb-4">⏰</div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#1A1A1A' }}>Proefperiode verlopen</h3>
                  <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
                    Je 14-daagse proefperiode is afgelopen. Upgrade naar Pro om de AI assistent te blijven gebruiken.
                  </p>
                  <Link
                    href="/settings#abonnement"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: '#288760' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Upgrade naar Pro
                  </Link>
                </div>
              )}

              {/* Chat limit reached block */}
              {!trialExpired && chatLimitReached && (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="text-4xl mb-4">🚫</div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#1A1A1A' }}>Chat limiet bereikt</h3>
                  <p className="text-sm mb-5" style={{ color: '#6B7280' }}>
                    Je hebt je {MAX_FREE_CHATS} gratis AI chats gebruikt tijdens de proefperiode. Upgrade naar Pro voor onbeperkte chats.
                  </p>
                  <Link
                    href="/settings#abonnement"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: '#288760' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Upgrade naar Pro
                  </Link>
                </div>
              )}

              {/* Normal chat messages */}
              {!isBlocked && (
                <>
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)', boxShadow: '0 4px 20px rgba(40,135,96,0.4)' }}
                      >
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2c0 0 .9 5.2 3.2 7.6C17.5 12 23 12 23 12s-5.5 0-7.8 2.4C12.9 16.8 12 22 12 22s-.9-5.2-3.2-7.6C6.5 12 1 12 1 12s5.5 0 7.8-2.4C11.1 7.2 12 2 12 2z" />
                          <path d="M19.5 3c0 0 .4 2.1 1.4 3.1 1 1 3.1 1.4 3.1 1.4s-2.1.4-3.1 1.4c-1 1-1.4 3.1-1.4 3.1s-.4-2.1-1.4-3.1C17.1 7.9 15 7.5 15 7.5s2.1-.4 3.1-1.4c1-1 1.4-3.1 1.4-3.1z" opacity="0.75" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>Hallo! Ik ben je AI bouw assistent.</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>Stel me een vraag over je verbouwing, budget, of aannemers.</p>
                      <div className="mt-4 grid gap-2">
                        {placeholders.slice(0, 3).map((p) => (
                          <button
                            key={p}
                            onClick={() => { setInput(p); inputRef.current?.focus(); }}
                            className="text-left px-3 py-2 rounded-xl text-xs border transition-colors hover:bg-white"
                            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 mr-2 mt-1"
                          style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a2a 50%, #288760 100%)' }}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2c0 0 .9 5.2 3.2 7.6C17.5 12 23 12 23 12s-5.5 0-7.8 2.4C12.9 16.8 12 22 12 22s-.9-5.2-3.2-7.6C6.5 12 1 12 1 12s5.5 0 7.8-2.4C11.1 7.2 12 2 12 2z" />
                          </svg>
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
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full animate-bounce"
                                style={{ backgroundColor: '#9CA3AF', animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input — hidden when blocked */}
            {!isBlocked && (
              <div className="p-4 border-t" style={{ borderColor: '#E5E7EB' }}>
                <div
                  className="flex items-end gap-2 rounded-xl border px-3 py-2"
                  style={{ borderColor: '#E5E7EB' }}
                >
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-center" style={{ color: '#9CA3AF' }}>
                  Enter om te versturen · Shift+Enter voor nieuwe regel
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
