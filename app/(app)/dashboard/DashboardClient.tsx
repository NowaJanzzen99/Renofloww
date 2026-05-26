'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, timeAgo } from '@/lib/utils';
import type { Profile, Project, Task, Expense } from '@/types';

interface Props {
  greeting: string;
  profile: Profile | null;
  activeProject: Project | null;
  todayTasks: Task[];
  allTasks: Task[];
  expenses: Expense[];
  pendingQuotesCount: number;
  totalExpenses: number;
  budget: number;
  budgetPercentage: number;
  activeDays: number;
}

// ─── Donut gauge ─────────────────────────────────────────────────────────────
function DonutGauge({ percentage, color }: { percentage: number; color: string }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const filled = (percentage / 100) * circ;
  return (
    <svg className="w-20 h-20 sm:w-24 sm:h-24" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }}
      />
      <text x="48" y="45" textAnchor="middle" fontSize="17" fontWeight="800" fill={color} fontFamily="inherit">{percentage}%</text>
      <text x="48" y="62" textAnchor="middle" fontSize="9" fontWeight="500" fill="#9CA3AF" fontFamily="inherit">gebruikt</text>
    </svg>
  );
}

// ─── Local date helper (avoids UTC offset issues with toISOString) ────────────
function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Streak card ──────────────────────────────────────────────────────────────
function ActiveDaysCard({
  activeDays,
  startDate,
  activeDates,
}: {
  activeDays: number;
  startDate?: string | null;
  activeDates: Set<string>;
}) {
  const today = localDateStr();

  // Build array of dates from startDate up to today (max 28 days shown)
  const days = useMemo(() => {
    if (!startDate) return [];
    const result: { date: string; hasActivity: boolean; isToday: boolean }[] = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const [ty, tm, td] = today.split('-').map(Number);
    const end = new Date(ty, tm - 1, td);
    const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
    const startOffset = Math.max(0, diff + 1 - 28); // skip old days if > 28

    for (let i = startOffset; i <= diff; i++) {
      const d = new Date(sy, sm - 1, sd + i);
      const dateStr = localDateStr(d);
      result.push({
        date: dateStr,
        hasActivity: activeDates.has(dateStr),
        isToday: dateStr === today,
      });
    }
    return result;
  }, [startDate, today, activeDates]);

  // Current streak: consecutive days with activity ending today
  const currentStreak = useMemo(() => {
    const allDays = [...days].reverse();
    let streak = 0;
    for (const d of allDays) {
      if (d.hasActivity) streak++;
      else break;
    }
    return streak;
  }, [days]);

  return (
    <div
      className="rounded-2xl p-3 sm:p-5 border flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full"
      style={{ backgroundColor: '#FAF5FF', borderColor: '#E9D5FF', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Actieve dagen</p>
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#9333EA22' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#9333EA' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Streak number */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-black" style={{ color: '#1A1A1A' }}>{activeDays}</span>
        <span className="text-xl leading-none">🔥</span>
        {currentStreak > 0 && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#9333EA22', color: '#9333EA' }}>
            {currentStreak} dag streak
          </span>
        )}
      </div>

      {/* Dot grid: 7 per row = week view, properly aligned Mon–Sun */}
      {days.length > 0 ? (
        <div className="flex-1">
          {/* Day labels Mon–Sun */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['M','D','W','D','V','Z','Z'].map((d, i) => (
              <div key={i} className="text-center" style={{ fontSize: '8px', color: '#C4B5FD', fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {/* Dot grid — pad start so first dot falls on its correct day column */}
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              // Leading empty cells so first day aligns with its day-of-week
              const [fy, fm, fd] = days[0].date.split('-').map(Number);
              const firstDOW = (new Date(fy, fm - 1, fd).getDay() + 6) % 7; // 0=Mon
              return [
                ...Array(firstDOW).fill(null).map((_, i) => <div key={`pad-${i}`} />),
                ...days.map((day) => {
                  const [y, m, d] = day.date.split('-').map(Number);
                  const label = new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <div
                      key={day.date}
                      title={label}
                      className="rounded-sm transition-all duration-200"
                      style={{
                        aspectRatio: '1',
                        backgroundColor: day.isToday
                          ? '#9333EA'
                          : day.hasActivity
                          ? '#A855F7'
                          : '#EDE9FE',
                        boxShadow: day.isToday ? '0 0 8px rgba(147,51,234,0.5)' : 'none',
                        transform: day.isToday ? 'scale(1.1)' : 'scale(1)',
                        opacity: day.hasActivity || day.isToday ? 1 : 0.5,
                      }}
                    />
                  );
                }),
              ];
            })()}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-center" style={{ color: '#C4B5FD' }}>Stel een startdatum in om je streak bij te houden</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          {startDate
            ? `Gestart op ${new Date(startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}`
            : 'Geen startdatum ingesteld'}
        </p>
        <Link href="/streak" className="text-xs font-semibold whitespace-nowrap" style={{ color: '#9333EA' }}>
          Bekijk streak →
        </Link>
      </div>
    </div>
  );
}

// ─── Draggable wrapper ────────────────────────────────────────────────────────
function DraggableCard({
  id,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  children,
}: {
  id: string;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="relative h-full transition-all duration-200 select-none group"
      style={{
        opacity: isDragging ? 0.45 : 1,
        transform: isOver ? 'scale(1.02)' : 'scale(1)',
        zIndex: isDragging ? 10 : 1,
      }}
    >
      {/* Drag handle — centered top, desktop only */}
      <div
        className="hidden md:flex absolute top-2.5 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-all duration-200 cursor-grab active:cursor-grabbing"
        title="Kaart verplaatsen"
      >
        <svg width="20" height="8" viewBox="0 0 20 8" fill="#64748B">
          <circle cx="2"  cy="2" r="1.5" />
          <circle cx="10" cy="2" r="1.5" />
          <circle cx="18" cy="2" r="1.5" />
          <circle cx="2"  cy="6" r="1.5" />
          <circle cx="10" cy="6" r="1.5" />
          <circle cx="18" cy="6" r="1.5" />
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
  greeting,
  profile,
  activeProject,
  todayTasks: initialTodayTasks,
  allTasks: initialAllTasks,
  expenses: initialExpenses,
  pendingQuotesCount: initialPendingQuotesCount,
  budget,
  activeDays,
}: Props) {
  const [todayTasks, setTodayTasks] = useState<Task[]>(initialTodayTasks);
  const [allTasks, setAllTasks] = useState<Task[]>(initialAllTasks);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(initialPendingQuotesCount);
  const [upgradedBanner, setUpgradedBanner] = useState(false);

  // Drag-and-drop card order (persisted in localStorage)
  const DEFAULT_ORDER = ['budget', 'taken', 'offertes', 'actieve'];
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_ORDER);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Load saved order after mount (avoid SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf-card-order');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Validate all keys are present
        if (DEFAULT_ORDER.every(k => parsed.includes(k))) setCardOrder(parsed);
      }
    } catch {}
  }, []);

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId !== id) setDragOverId(id);
  };
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const next = [...cardOrder];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    setCardOrder(next);
    try { localStorage.setItem('rf-card-order', JSON.stringify(next)); } catch {}
    setDraggedId(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  // Derived values
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budgetPercentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetColor = budgetPercentage >= 80 ? '#EF4444' : budgetPercentage >= 50 ? '#F59E0B' : '#288760';

  // Dates that had activity (for streak)
  const activeDates = useMemo(() => {
    const s = new Set<string>();
    expenses.forEach(e => { if (e.created_at) s.add(e.created_at.split('T')[0]); });
    allTasks.filter(t => t.completed_at).forEach(t => s.add(t.completed_at!.split('T')[0]));
    return s;
  }, [expenses, allTasks]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setUpgradedBanner(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const refreshTasks = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!activeProject) return;
    const today = new Date().toISOString().split('T')[0];
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
      setTodayTasks(upd);
      setAllTasks(upd);
    }
  };

  const isTaskCompleted = (t: Task) => t.status === 'voltooid' || t.status === ('done' as string);

  const recentActivity = [
    ...expenses.slice(0, 5).map(e => ({ id: e.id, type: 'expense' as const, description: `Kosten: ${e.description} — ${formatCurrency(Number(e.amount))}`, time: e.created_at })),
    ...allTasks.filter(t => (t.status === 'voltooid' || t.status === 'done') && t.completed_at).slice(0, 5).map(t => ({ id: t.id, type: 'task' as const, description: `Taak voltooid: ${t.title}`, time: t.completed_at! })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  const activityStyle = {
    expense: { bg: '#F0FDF4', color: '#16A34A', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    task:    { bg: '#EFF6FF', color: '#3B82F6', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> },
  };

  // ── Card content definitions ──
  const cardContent: Record<string, React.ReactNode> = {
    budget: (
      <div
        className="rounded-2xl p-3 sm:p-5 border flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full"
        style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide self-start mb-2" style={{ color: '#6B7280' }}>Budget gebruikt</p>
        <DonutGauge percentage={budgetPercentage} color={budgetColor} />
        <p className="text-sm font-bold mt-1" style={{ color: '#1A1A1A' }}>{budget > 0 ? formatCurrency(totalExpenses) : '—'}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{budget > 0 ? `van ${formatCurrency(budget)}` : 'Geen budget'}</p>
      </div>
    ),
    taken: (
      <div
        className="rounded-2xl p-3 sm:p-5 border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full"
        style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Taken vandaag</p>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3B82F622' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#3B82F6' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{todayTasks.length}</div>
          <div className="text-xs mt-1">
            <Link href={activeProject ? `/projects/${activeProject.id}?tab=taken` : '/projects'} style={{ color: '#3B82F6' }}>Bekijk taken →</Link>
          </div>
        </div>
      </div>
    ),
    offertes: (
      <div
        className="rounded-2xl p-3 sm:p-5 border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full"
        style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Open offertes</p>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F59E0B22' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#F59E0B' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{pendingQuotesCount}</div>
          <div className="text-xs mt-1">
            <Link href={activeProject ? `/projects/${activeProject.id}?tab=offertes` : '/projects'} style={{ color: '#F59E0B' }}>Bekijk offertes →</Link>
          </div>
        </div>
      </div>
    ),
    actieve: (
      <ActiveDaysCard
        activeDays={activeDays}
        startDate={activeProject?.start_date}
        activeDates={activeDates}
      />
    ),
  };

  return (
    <div
      className="p-4 sm:p-6 max-w-7xl mx-auto min-h-full"
      style={{ background: 'linear-gradient(160deg, #F8FAF9 0%, #FFFFFF 60%)' }}
    >
      {/* Upgraded banner */}
      {upgradedBanner && (
        <div className="mb-5 px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #B7E5BA, #D1FAE5)', color: '#1A5140', border: '1px solid #6EE7B7' }}>
          <span>Welkom bij Renofloww Pro! 🎉 Je hebt nu toegang tot alle functies.</span>
          <button onClick={() => setUpgradedBanner(false)} className="opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-4 sm:mb-7">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>
          {greeting}, {profile?.name?.split(' ')[0] || 'daar'}! 👋
        </h1>
        {activeProject && (
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Actief project:{' '}
            <Link href={`/projects/${activeProject.id}`} className="font-semibold" style={{ color: '#288760' }}>{activeProject.name}</Link>
          </p>
        )}
      </div>

      {/* ── Stat cards (drag & drop) ── */}
      <p className="text-xs mb-2 hidden md:block" style={{ color: '#C4B5FD' }}>⠿ Sleep de kaarten om de volgorde aan te passen</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-4 sm:mb-7">
        {cardOrder.map(id => (
          <DraggableCard
            key={id}
            id={id}
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
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Budget overview */}
        {activeProject && budget > 0 && (
          <div className="rounded-2xl p-4 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: '#1A1A1A' }}>Budget overzicht</h2>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div><p className="text-xs" style={{ color: '#6B7280' }}>Totaal budget</p><p className="text-base font-bold mt-1" style={{ color: '#1A1A1A' }}>{formatCurrency(budget)}</p></div>
              <div><p className="text-xs" style={{ color: '#6B7280' }}>Uitgegeven</p><p className="text-base font-bold mt-1" style={{ color: budgetColor }}>{formatCurrency(totalExpenses)}</p></div>
              <div><p className="text-xs" style={{ color: '#6B7280' }}>Resterend</p><p className="text-base font-bold mt-1" style={{ color: '#288760' }}>{formatCurrency(Math.max(budget - totalExpenses, 0))}</p></div>
            </div>
            <div className="w-full rounded-full h-3 mb-2 overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
              <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${budgetPercentage}%`, background: `linear-gradient(90deg, ${budgetColor}cc, ${budgetColor})` }} />
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#9CA3AF' }}>0%</span>
              <span className="text-xs font-semibold" style={{ color: budgetColor }}>{budgetPercentage}% gebruikt</span>
              <span className="text-xs" style={{ color: '#9CA3AF' }}>100%</span>
            </div>
            {budgetPercentage >= 80 && (
              <div className="mt-4 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Let op: je hebt al {budgetPercentage}% van je budget gebruikt.
              </div>
            )}
          </div>
        )}

        {!activeProject && (
          <div className="rounded-2xl p-4 sm:p-6 bg-white border text-center" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>Geen actief project</h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Maak je eerste verbouwingsproject aan om te beginnen.</p>
            <Link href="/projects" className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#288760' }}>Project aanmaken</Link>
          </div>
        )}

        {/* Taken vandaag */}
        <div className="rounded-2xl p-4 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Taken vandaag</h2>
            {activeProject && <Link href={`/projects/${activeProject.id}?tab=taken`} className="text-xs font-medium" style={{ color: '#288760' }}>Alle taken →</Link>}
          </div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm" style={{ color: '#6B7280' }}>Geen taken voor vandaag</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map(task => {
                const done = isTaskCompleted(task);
                return (
                  <li key={task.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-all duration-150 cursor-pointer" onClick={() => toggleTask(task)}>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{ borderColor: done ? '#288760' : '#D1D5DB', backgroundColor: done ? '#288760' : 'white', boxShadow: done ? '0 0 0 3px rgba(40,135,96,0.15)' : 'none' }}>
                      <svg className="w-3.5 h-3.5 text-white transition-all duration-200" style={{ opacity: done ? 1 : 0, transform: done ? 'scale(1)' : 'scale(0.5)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Recente activiteit */}
        <div className="rounded-2xl p-4 sm:p-6 bg-white border lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: '#1A1A1A' }}>Recente activiteit</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm" style={{ color: '#6B7280' }}>Nog geen activiteit. Voeg kosten of taken toe.</p></div>
          ) : (
            <ul className="space-y-1">
              {recentActivity.map((activity, idx) => {
                const s = activityStyle[activity.type as keyof typeof activityStyle] ?? activityStyle.expense;
                const isLast = idx === recentActivity.length - 1;
                return (
                  <li key={activity.id} className="flex items-start gap-0">
                    <div className="flex flex-col items-center mr-3 shrink-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>{s.icon}</div>
                      {!isLast && <div className="w-px flex-1 my-1" style={{ backgroundColor: '#E5E7EB', minHeight: '16px' }} />}
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
  );
}
