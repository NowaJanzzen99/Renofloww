'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, timeAgo } from '@/lib/utils';
import type { Profile, Project, Task, Expense, Room } from '@/types';
import GanttChart from '@/components/GanttChart';

interface Props {
  greeting: string;
  profile: Profile | null;
  activeProject: Project | null;
  todayTasks: Task[];
  allTasks: Task[];
  expenses: Expense[];
  rooms: Room[];
  pendingQuotesCount: number;
  totalExpenses: number;
  budget: number;
  budgetPercentage: number;
  activeDays: number;
}

// ─── Local date helper ────────────────────────────────────────────────────────
function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Donut gauge ──────────────────────────────────────────────────────────────
function DonutGauge({ percentage, color }: { percentage: number; color: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = (percentage / 100) * circ;
  return (
    <svg className="w-16 h-16" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill={color} fontFamily="inherit">{percentage}%</text>
    </svg>
  );
}

// ─── Streak dots card ─────────────────────────────────────────────────────────
function ActiveDaysCard({
  activeDays,
  startDate,
  activeDates,
  currentStreak,
}: {
  activeDays: number;
  startDate?: string | null;
  activeDates: Set<string>;
  currentStreak: number;
}) {
  const today = localDateStr();

  // Always show the current Mon–Sun week (7 dots, no padding cells needed)
  const days = useMemo(() => {
    const [ty, tm, td] = today.split('-').map(Number);
    const todayDate = new Date(ty, tm - 1, td);
    const dow = (todayDate.getDay() + 6) % 7; // 0=Mon … 6=Sun
    const monday = new Date(ty, tm - 1, td - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateStr = localDateStr(d);
      return {
        date: dateStr,
        hasActivity: activeDates.has(dateStr),
        isToday: dateStr === today,
        isFuture: d > todayDate,
      };
    });
  }, [today, activeDates]);

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 60%, #4c0d87 100%)',
        boxShadow: '0 4px 24px rgba(109,40,217,0.25)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#C4B5FD' }}>Huidige streak</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(167,139,250,0.15)' }}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#C4B5FD' }}>
            <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z" />
          </svg>
        </div>
      </div>

      {/* Number — always shows the CURRENT STREAK (same as streak page) */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-4xl font-black text-white">{currentStreak}</span>
        <span className="text-2xl leading-none">🔥</span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'rgba(167,139,250,0.7)' }}>
        {currentStreak === 1 ? 'dag op rij' : 'dagen op rij'} · {activeDays} totaal
      </p>

      {/* Dot grid — always current week Mon–Sun, one clean row */}
      <div className="flex-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['M','D','W','D','V','Z','Z'].map((d, i) => (
            <div key={i} className="text-center" style={{ fontSize: '8px', color: '#A78BFA', fontWeight: 700 }}>{d}</div>
          ))}
        </div>
        {/* 7 dots, one per day */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const [y, m, d] = day.date.split('-').map(Number);
            const label = new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });
            return (
              <div
                key={day.date}
                title={label}
                className="rounded-sm transition-all duration-200"
                style={{
                  aspectRatio: '1',
                  backgroundColor: day.isToday
                    ? '#A855F7'
                    : day.hasActivity
                    ? '#7C3AED'
                    : day.isFuture
                    ? 'rgba(167,139,250,0.08)'
                    : 'rgba(167,139,250,0.2)',
                  boxShadow: day.isToday ? '0 0 8px rgba(168,85,247,0.7)' : 'none',
                  transform: day.isToday ? 'scale(1.12)' : 'scale(1)',
                  opacity: day.isFuture ? 0.25 : day.hasActivity || day.isToday ? 1 : 0.45,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
        <p className="text-xs" style={{ color: '#A78BFA' }}>
          {startDate
            ? `Gestart ${new Date(startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
            : 'Geen startdatum'}
        </p>
        <Link href="/streak" className="text-xs font-semibold" style={{ color: '#C4B5FD' }}>
          Bekijk streak →
        </Link>
      </div>
    </div>
  );
}

// ─── Draggable wrapper ────────────────────────────────────────────────────────
function DraggableCard({
  id, isDragging, isOver, onDragStart, onDragOver, onDrop, onDragEnd, children,
}: {
  id: string; isDragging: boolean; isOver: boolean;
  onDragStart: () => void; onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void; onDragEnd: () => void; children: React.ReactNode;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="relative h-full transition-all duration-200 select-none group"
      style={{ opacity: isDragging ? 0.4 : 1, transform: isOver ? 'scale(1.02)' : 'scale(1)', zIndex: isDragging ? 10 : 1 }}
    >
      <div className="hidden md:flex absolute top-2.5 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-30 hover:!opacity-70 transition-all cursor-grab active:cursor-grabbing">
        <svg width="20" height="8" viewBox="0 0 20 8" fill="#64748B">
          <circle cx="2" cy="2" r="1.5" /><circle cx="10" cy="2" r="1.5" /><circle cx="18" cy="2" r="1.5" />
          <circle cx="2" cy="6" r="1.5" /><circle cx="10" cy="6" r="1.5" /><circle cx="18" cy="6" r="1.5" />
        </svg>
      </div>
      {isOver && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: '0 0 0 3px #A855F7', borderRadius: '1rem' }} />
      )}
      <div className="h-full">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardClient({
  greeting, profile, activeProject,
  todayTasks: initialTodayTasks,
  allTasks: initialAllTasks,
  expenses: initialExpenses,
  rooms,
  pendingQuotesCount: initialPendingQuotesCount,
  budget,
  activeDays,
}: Props) {
  const [todayTasks, setTodayTasks] = useState<Task[]>(initialTodayTasks);
  const [allTasks, setAllTasks] = useState<Task[]>(initialAllTasks);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(initialPendingQuotesCount);
  const [upgradedBanner, setUpgradedBanner] = useState(false);

  const DEFAULT_ORDER = ['budget', 'taken', 'offertes', 'actieve'];
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_ORDER);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf-card-order');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (DEFAULT_ORDER.every(k => parsed.includes(k))) setCardOrder(parsed);
      }
    } catch {}
  }, []);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); if (draggedId !== id) setDragOverId(id); };
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = [...cardOrder];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    setCardOrder(next);
    try { localStorage.setItem('rf-card-order', JSON.stringify(next)); } catch {}
    setDraggedId(null); setDragOverId(null);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budgetPercentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetColor = budgetPercentage >= 80 ? '#EF4444' : budgetPercentage >= 50 ? '#F59E0B' : '#288760';

  const activeDates = useMemo(() => {
    const s = new Set<string>();
    // Use expense.date (the actual date field) when available — avoids UTC offset issues
    expenses.forEach(e => {
      const d = (e as { date?: string }).date || (e.created_at ? e.created_at.split('T')[0] : null);
      if (d) s.add(d);
    });
    allTasks.filter(t => t.completed_at).forEach(t => s.add(t.completed_at!.split('T')[0]));
    return s;
  }, [expenses, allTasks]);

  // Current consecutive streak — same algorithm as the streak page (with grace period for yesterday)
  const currentStreak = useMemo(() => {
    const todayStr = localDateStr();
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return localDateStr(d); })();
    const startFrom = activeDates.has(todayStr) ? todayStr : activeDates.has(yesterday) ? yesterday : null;
    if (!startFrom) return 0;
    let streak = 0;
    let d = new Date(startFrom.split('-').join('/'));
    while (activeDates.has(localDateStr(d))) {
      streak++;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    }
    return streak;
  }, [activeDates]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setUpgradedBanner(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const refreshTasks = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!activeProject) return;
    const today = localDateStr();
    const [todayRes, allRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', activeProject.id).eq('due_date', today),
      supabase.from('tasks').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
    ]);
    if (todayRes.data) setTodayTasks(todayRes.data);
    if (allRes.data) setAllTasks(allRes.data);
  }, [activeProject]);

  const refreshExpenses = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!activeProject) return;
    const { data } = await supabase.from('expenses').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false });
    if (data) setExpenses(data);
  }, [activeProject]);

  const refreshQuotes = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!activeProject) return;
    const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('project_id', activeProject.id).in('status', ['in_behandeling', 'pending']);
    setPendingQuotesCount(count ?? 0);
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-${activeProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${activeProject.id}` }, () => refreshTasks(supabase))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `project_id=eq.${activeProject.id}` }, () => refreshExpenses(supabase))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `project_id=eq.${activeProject.id}` }, () => refreshQuotes(supabase))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeProject, refreshTasks, refreshExpenses, refreshQuotes]);

  const toggleTask = async (task: Task) => {
    const supabase = createClient();
    const newStatus = task.status === 'voltooid' || task.status === 'done' ? 'openstaand' : 'voltooid';
    const { data } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: newStatus === 'voltooid' ? new Date().toISOString() : null })
      .eq('id', task.id).select().single();
    if (data) {
      const upd = (prev: Task[]) => prev.map(t => t.id === task.id ? { ...t, status: newStatus as Task['status'], completed_at: data.completed_at } : t);
      setTodayTasks(upd); setAllTasks(upd);
    }
  };

  const isTaskCompleted = (t: Task) => t.status === 'voltooid' || t.status === ('done' as string);

  const recentActivity = [
    ...expenses.slice(0, 5).map(e => ({ id: e.id, type: 'expense' as const, description: `Kosten: ${e.description} — ${formatCurrency(Number(e.amount))}`, time: e.created_at })),
    ...allTasks.filter(t => (t.status === 'voltooid' || t.status === 'done') && t.completed_at).slice(0, 5).map(t => ({ id: t.id, type: 'task' as const, description: `Taak voltooid: ${t.title}`, time: t.completed_at! })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  const completedTodayCount = todayTasks.filter(t => isTaskCompleted(t)).length;

  // ── Stat card definitions ────────────────────────────────────────────────────
  const cardContent: Record<string, React.ReactNode> = {
    budget: (
      <div
        className="rounded-2xl p-4 sm:p-5 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Budget</p>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${budgetColor}18` }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: budgetColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <DonutGauge percentage={budgetPercentage} color={budgetColor} />
          <div>
            <p className="text-lg font-black" style={{ color: '#1A1A1A' }}>{budget > 0 ? formatCurrency(totalExpenses) : '—'}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{budget > 0 ? `van ${formatCurrency(budget)}` : 'Geen budget'}</p>
          </div>
        </div>
        {budget > 0 && (
          <div className="mt-auto">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${budgetPercentage}%`, backgroundColor: budgetColor }} />
            </div>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{formatCurrency(Math.max(budget - totalExpenses, 0))} resterend</p>
          </div>
        )}
      </div>
    ),
    taken: (
      <div
        className="rounded-2xl p-4 sm:p-5 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Taken vandaag</p>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3B82F6' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-4xl font-black mb-1" style={{ color: '#1A1A1A' }}>{todayTasks.length}</p>
          {todayTasks.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EFF6FF' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0}%`, backgroundColor: '#3B82F6' }} />
              </div>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{completedTodayCount}/{todayTasks.length}</span>
            </div>
          )}
          <Link href={activeProject ? `/projects/${activeProject.id}?tab=taken` : '/projects'} className="text-xs font-semibold" style={{ color: '#3B82F6' }}>
            Bekijk taken →
          </Link>
        </div>
      </div>
    ),
    offertes: (
      <div
        className="rounded-2xl p-4 sm:p-5 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Open offertes</p>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFFBEB' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#F59E0B' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-4xl font-black mb-1" style={{ color: '#1A1A1A' }}>{pendingQuotesCount}</p>
          <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>In behandeling</p>
          <Link href={activeProject ? `/projects/${activeProject.id}?tab=offertes` : '/projects'} className="text-xs font-semibold" style={{ color: '#F59E0B' }}>
            Bekijk offertes →
          </Link>
        </div>
      </div>
    ),
    actieve: (
      <ActiveDaysCard
        activeDays={activeDays}
        startDate={activeProject?.start_date}
        activeDates={activeDates}
        currentStreak={currentStreak}
      />
    ),
  };

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(160deg, #F8FAF9 0%, #FAFAFA 100%)' }}>
      {/* Single max-width wrapper so hero + cards are always the same width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

      {/* Upgraded banner */}
      {upgradedBanner && (
        <div className="mt-4 sm:mt-6 px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #B7E5BA, #D1FAE5)', color: '#1A5140', border: '1px solid #6EE7B7' }}>
          <span>Welkom bij Renofloww Pro! 🎉 Je hebt nu toegang tot alle functies.</span>
          <button onClick={() => setUpgradedBanner(false)} className="opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ── Hero greeting ────────────────────────────────────────────────────── */}
      <div className="pt-4 sm:pt-6 pb-0">
        <div
          className="rounded-2xl p-5 sm:p-7 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 45%, #1e4d36 100%)',
            boxShadow: '0 8px 32px rgba(13,31,26,0.35)',
          }}
        >
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(40,135,96,0.25) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(40,135,96,0.15) 0%, transparent 70%)' }} />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: greeting */}
            <div>
              {activeProject && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)', animation: 'pulse 2s infinite' }} />
                  <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>
                    {activeProject.name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: 'rgba(40,135,96,0.25)', color: '#86EFAC' }}
                  >
                    {activeProject.status}
                  </span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {greeting}, {profile?.name?.split(' ')[0] || 'daar'}! 👋
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {activeProject
                  ? `${activeProject.type.charAt(0).toUpperCase() + activeProject.type.slice(1).replace('_', ' ')} · Gestart ${activeProject.start_date ? new Date(activeProject.start_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : 'onbekend'}`
                  : 'Start je eerste verbouwingsproject om te beginnen.'}
              </p>
            </div>

            {/* Right: key stats */}
            {activeProject && budget > 0 && (
              <div className="flex items-center gap-5 sm:gap-7">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white">{budgetPercentage}%</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>budget</p>
                </div>
                <div className="w-px h-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white">{todayTasks.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>taken</p>
                </div>
                <div className="w-px h-10" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white">{currentStreak}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>🔥 streak</p>
                </div>
              </div>
            )}
            {!activeProject && (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#288760', color: '#FFFFFF' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Project aanmaken
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="pt-4 sm:pt-5 pb-4 sm:pb-6">

        {/* Drag hint */}
        <p className="text-xs mb-3 hidden md:block" style={{ color: '#C4B5FD' }}>⠿ Sleep de kaarten om de volgorde aan te passen</p>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {cardOrder.map(id => (
            <DraggableCard
              key={id} id={id}
              isDragging={draggedId === id}
              isOver={dragOverId === id}
              onDragStart={() => handleDragStart(id)}
              onDragOver={e => handleDragOver(e, id)}
              onDrop={() => handleDrop(id)}
              onDragEnd={handleDragEnd}
            >
              {cardContent[id]}
            </DraggableCard>
          ))}
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid lg:grid-cols-2 gap-4">

          {/* Budget details */}
          {activeProject && budget > 0 && (
            <div
              className="rounded-2xl p-5 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <h2 className="text-sm font-bold mb-5 uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Budget overzicht</h2>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Budget', value: formatCurrency(budget), color: '#1A1A1A' },
                  { label: 'Uitgegeven', value: formatCurrency(totalExpenses), color: budgetColor },
                  { label: 'Resterend', value: formatCurrency(Math.max(budget - totalExpenses, 0)), color: '#288760' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{label}</p>
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${budgetPercentage}%`, background: `linear-gradient(90deg, ${budgetColor}bb, ${budgetColor})` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>0%</span>
                <span className="text-xs font-bold" style={{ color: budgetColor }}>{budgetPercentage}% gebruikt</span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>100%</span>
              </div>
              {budgetPercentage >= 80 && (
                <div className="mt-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Let op: je hebt al {budgetPercentage}% van je budget gebruikt.
                </div>
              )}
            </div>
          )}

          {!activeProject && (
            <div className="rounded-2xl p-5 sm:p-6 bg-white border text-center" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <div className="text-4xl mb-3">🏗️</div>
              <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>Geen actief project</h3>
              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Maak je eerste verbouwingsproject aan om te beginnen.</p>
              <Link href="/projects" className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#288760' }}>Project aanmaken</Link>
            </div>
          )}

          {/* Taken vandaag */}
          <div
            className="rounded-2xl p-5 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Taken vandaag</h2>
              {activeProject && <Link href={`/projects/${activeProject.id}?tab=taken`} className="text-xs font-semibold" style={{ color: '#288760' }}>Alle taken →</Link>}
            </div>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm font-medium mb-0.5" style={{ color: '#1A1A1A' }}>Vrije dag!</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Geen taken gepland voor vandaag.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {todayTasks.map(task => {
                  const done = isTaskCompleted(task);
                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleTask(task)}
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                        style={{ borderColor: done ? '#288760' : '#D1D5DB', backgroundColor: done ? '#288760' : 'white' }}
                      >
                        <svg className="w-3 h-3 text-white" style={{ opacity: done ? 1 : 0, transform: done ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.2s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm flex-1 transition-all duration-200" style={{ color: done ? '#9CA3AF' : '#1A1A1A', textDecoration: done ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Planning (Gantt compact) */}
          {activeProject && rooms.length > 0 && (
            <div
              className="rounded-2xl p-5 sm:p-6 bg-white border lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Planning</h2>
                <Link href={`/projects/${activeProject.id}?tab=overzicht`} className="text-xs font-semibold" style={{ color: '#288760' }}>
                  Bewerk planning →
                </Link>
              </div>
              <GanttChart
                rooms={rooms}
                projectStart={activeProject.start_date}
                projectEnd={activeProject.end_date}
                compact
              />
            </div>
          )}

          {/* Recente activiteit */}
          <div
            className={`rounded-2xl p-5 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5 ${(!activeProject || rooms.length === 0) ? 'lg:col-span-2' : 'lg:col-span-2'}`}
            style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <h2 className="text-sm font-bold uppercase tracking-wide mb-5" style={{ color: '#9CA3AF' }}>Recente activiteit</h2>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Nog geen activiteit. Voeg kosten of taken toe.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentActivity.map((activity, idx) => {
                  const isLast = idx === recentActivity.length - 1;
                  const isExpense = activity.type === 'expense';
                  return (
                    <li key={activity.id} className="flex items-start gap-0">
                      <div className="flex flex-col items-center mr-3 shrink-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isExpense ? '#F0FDF4' : '#EFF6FF', color: isExpense ? '#16A34A' : '#3B82F6' }}
                        >
                          {isExpense ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </div>
                        {!isLast && <div className="w-px flex-1 my-1" style={{ backgroundColor: '#F3F4F6', minHeight: '16px' }} />}
                      </div>
                      <div className="flex-1 min-w-0 py-1.5 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default" style={{ marginBottom: isLast ? 0 : '4px' }}>
                        <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{activity.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{timeAgo(activity.time)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      </div>{/* end max-w-7xl wrapper */}
    </div>
  );
}
