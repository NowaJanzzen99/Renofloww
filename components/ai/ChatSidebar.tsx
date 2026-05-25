'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AiMessage } from '@/types';

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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

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
    } catch (error) {
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
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 z-40"
        style={{ backgroundColor: '#288760', boxShadow: '0 4px 20px rgba(40,135,96,0.4)' }}
        aria-label="AI Assistent openen"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {hasUnread && (
          <span
            className="absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white"
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
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: '#288760' }}
                >
                  🏠
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Renofloww AI</h3>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Altijd klaar om te helpen</p>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#F8FAF9' }}>
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏠</div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#1A1A1A' }}>Hallo! Ik ben je AI bouw assistent.</p>
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
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-1"
                      style={{ backgroundColor: '#288760' }}
                    >
                      AI
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
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
          </div>
        </div>
      )}
    </>
  );
}
