'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, timeAgo } from '@/lib/utils';
import type { Profile, Project, Task, Expense, Room, House } from '@/types';
import GanttChart from '@/components/GanttChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface WoningData {
  estimate: number | null;
  low: number | null;
  high: number | null;
  latestPeriod: string;
  latestIndex: number;
  purchaseIndex: number | null;
  mortgageRate: { rate: number; period: string; label: string } | null;
  isFallback: boolean;
}

interface Props {
  greeting: string;
  profile: Profile | null;
  activeProject: Project | null;
  allProjects: Project[];
  todayTasks: Task[];
  allTasks: Task[];
  expenses: Expense[];
  rooms: Room[];
  pendingQuotesCount: number;
  totalExpenses: number; // kept for backward compat; client recomputes from state
  budgetPercentage: number; // kept for backward compat; client recomputes from state
  activeDays: number;
  house: House | null;
}

// Short currency: no decimals, for large display numbers in cards
function formatShort(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
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
    <svg className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" viewBox="0 0 80 80">
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

// ─── Woningwaarde card ────────────────────────────────────────────────────────
function WoningwaardeCard({ house, data, loading }: { house: House | null; data: WoningData | null; loading: boolean }) {
  // No house profile set up yet
  if (!house) {
    return (
      <div className="rounded-2xl bg-white border flex flex-col items-center justify-center text-center p-6 h-full"
        style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', minHeight: 220 }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: '#F0FDF4' }}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: '#288760' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: '#1A1A1A' }}>Woningprofiel ontbreekt</p>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Stel je woning in om de marktwaarde te zien.</p>
        <Link href="/woningkosten" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F0FDF4', color: '#288760' }}>
          Woning instellen →
        </Link>
      </div>
    );
  }

  const estimate = data?.estimate ?? null;
  const purchasePrice = house.purchase_price ? Number(house.purchase_price) : null;
  const overwaarde = estimate && purchasePrice ? estimate - purchasePrice : null;
  const growthPct = estimate && purchasePrice && purchasePrice > 0
    ? ((estimate - purchasePrice) / purchasePrice * 100)
    : null;
  const isUp = (overwaarde ?? 0) >= 0;

  return (
    <div className="rounded-2xl bg-white border overflow-hidden flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

      {/* Dark header strip */}
      <div className="px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 100%)' }}>
        {/* Label row */}
        <div className="flex items-center gap-1.5 mb-2 min-w-0">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: '#6EE7B7' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6EE7B7' }}>Woningwaarde</span>
        </div>

        {/* Value */}
        {loading ? (
          <div className="flex gap-1 py-2">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#6EE7B7', opacity: 0.6, animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        ) : estimate ? (
          <>
            <p className="text-xl sm:text-2xl font-black text-white leading-tight">{formatCurrency(estimate)}</p>
            {growthPct !== null && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: isUp ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: isUp ? '#10B981' : '#F87171' }}>
                  {isUp ? '+' : ''}{growthPct.toFixed(1)}%
                </span>
                {overwaarde !== null && (
                  <span className="text-xs font-semibold" style={{ color: isUp ? '#6EE7B7' : '#F87171' }}>
                    {isUp ? '+' : ''}{formatCurrency(overwaarde)} overwaarde
                  </span>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {house.purchase_price ? 'Laden...' : 'Voeg aankoopprijs toe'}
          </p>
        )}
      </div>

      {/* Stats body */}
      <div className="flex-1 px-4 py-3">
        {house.address && (
          <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{house.address}</p>
        )}
      </div>

      {/* Footer link */}
      <div className="px-4 pb-4 pt-0">
        <Link href="/woningwaarde" className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#288760' }}>
          Bekijk alle details
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

// ─── Kostenverdeling card (dashboard) ────────────────────────────────────────
const DASH_CAT_COLORS: Record<string, string> = {
  verbouwing: '#288760', onderhoud: '#3EAA7A', reparatie: '#6EC99B',
  tuin: '#1A5140',       verzekering: '#4ade80', energie: '#B7E5BA',
  belasting: '#9CA3AF',  materiaal: '#288760',   arbeid: '#3EAA7A',
  vergunning: '#6EC99B', transport: '#1A5140',   overig: '#9CA3AF',
};
const DASH_CAT_LABELS: Record<string, string> = {
  verbouwing: 'Verbouwing', onderhoud: 'Onderhoud', reparatie: 'Reparatie',
  tuin: 'Tuin', verzekering: 'Verzekering', energie: 'Energie',
  belasting: 'Belasting', materiaal: 'Materiaal', arbeid: 'Arbeid',
  vergunning: 'Vergunning', transport: 'Transport', overig: 'Overig',
};
const fmt0 = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function WoningkostenCard({ data }: { data: { total: number; categories: Record<string, number> } | null }) {
  const cats = Object.entries(data?.categories ?? {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = data?.total ?? 0;
  const pieData = cats.map(([cat, val]) => ({ name: DASH_CAT_LABELS[cat] ?? cat, value: val, cat }));

  return (
    <div className="rounded-2xl bg-white border overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
      <div className="px-5 pt-5 pb-1 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Kostenverdeling</p>
        <Link href="/woningkosten" className="text-xs font-semibold" style={{ color: '#288760' }}>Bekijk alles →</Link>
      </div>
      {cats.length === 0 ? (
        <div className="px-5 pb-5 pt-3">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Nog geen kosten geregistreerd.</p>
          <Link href="/woningkosten" className="text-xs font-semibold mt-2 inline-block" style={{ color: '#288760' }}>Kosten toevoegen →</Link>
        </div>
      ) : (
        <div className="px-5 pb-5 pt-3 flex items-center gap-5">
          {/* Donut met totaal in midden */}
          <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((entry) => (
                    <Cell key={entry.cat} fill={DASH_CAT_COLORS[entry.cat] ?? '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => typeof v === 'number' ? fmt0(v) : v} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, lineHeight: 1 }}>totaal</span>
              <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 800, lineHeight: 1.3, textAlign: 'center' }}>
                {fmt0(total)}
              </span>
            </div>
          </div>
          {/* Legenda */}
          <div className="flex-1 min-w-0 space-y-2">
            {cats.map(([cat, val]) => (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DASH_CAT_COLORS[cat] ?? '#9CA3AF' }} />
                <span className="text-xs flex-1 truncate" style={{ color: '#374151' }}>{DASH_CAT_LABELS[cat] ?? cat}</span>
                <span className="text-xs font-semibold shrink-0" style={{ color: '#1A1A1A' }}>{fmt0(val)}</span>
                <span className="text-xs w-7 text-right shrink-0" style={{ color: '#9CA3AF' }}>
                  {total > 0 ? `${Math.round((val / total) * 100)}%` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardClient({
  greeting, profile, activeProject, allProjects,
  todayTasks: initialTodayTasks,
  allTasks: initialAllTasks,
  expenses: initialExpenses,
  rooms: initialRooms,
  pendingQuotesCount: initialPendingQuotesCount,
  activeDays,
  house,
}: Props) {
  const [todayTasks, setTodayTasks] = useState<Task[]>(initialTodayTasks);
  const [allTasks, setAllTasks] = useState<Task[]>(initialAllTasks);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(initialPendingQuotesCount);
  const [currentProject, setCurrentProject] = useState<Project | null>(activeProject);
  const [currentRooms, setCurrentRooms] = useState<Room[]>(initialRooms);
  const [allProjectsMode, setAllProjectsMode] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [upgradedBanner, setUpgradedBanner] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiTipAction, setAiTipAction] = useState<{ label: string; href: string } | null>(null);
  const [aiTipLoading, setAiTipLoading] = useState(false);
  const [woningData, setWoningData] = useState<WoningData | null>(null);
  const [woningLoading, setWoningLoading] = useState(false);
  const [woonkosten, setWoonkosten] = useState<{ total: number; categories: Record<string, number> } | null>(null);

  // Budget: sum all projects in "alle" mode, otherwise from current project
  const budget = useMemo(() =>
    allProjectsMode
      ? allProjects.reduce((s, p) => s + (Number(p.budget) || 0), 0)
      : Number(currentProject?.budget) || 0,
  [allProjectsMode, allProjects, currentProject]);

  // Fetch aggregated data for ALL projects
  const switchToAll = useCallback(async () => {
    if (allProjects.length === 0) return;
    setSwitching(true);
    setAllProjectsMode(true);
    setCurrentProject(null);
    const supabase = createClient();
    const today = localDateStr();
    const ids = allProjects.map(p => p.id);
    const [todayRes, allRes, expRes, quotesCount, roomsRes] = await Promise.all([
      supabase.from('tasks').select('*').in('project_id', ids).eq('due_date', today),
      supabase.from('tasks').select('*').in('project_id', ids).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').in('project_id', ids),
      supabase.from('quotes').select('*', { count: 'exact', head: true }).in('project_id', ids).in('status', ['in_behandeling', 'pending']),
      supabase.from('rooms').select('*').in('project_id', ids),
    ]);
    if (todayRes.data) setTodayTasks(todayRes.data);
    if (allRes.data) setAllTasks(allRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setPendingQuotesCount(quotesCount.count ?? 0);
    if (roomsRes.data) setCurrentRooms(roomsRes.data);
    try { localStorage.setItem('rf-active-project', '__all__'); } catch {}
    setSwitching(false);
  }, [allProjects]);

  const switchProject = useCallback(async (project: Project) => {
    if (project.id === currentProject?.id && !allProjectsMode) return;
    setSwitching(true);
    setAllProjectsMode(false);
    setCurrentProject(project);
    const supabase = createClient();
    const today = localDateStr();
    const [todayRes, allRes, expRes, quotesCount, roomsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', project.id).eq('due_date', today),
      supabase.from('tasks').select('*').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('project_id', project.id),
      supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('project_id', project.id).in('status', ['in_behandeling', 'pending']),
      supabase.from('rooms').select('*').eq('project_id', project.id),
    ]);
    if (todayRes.data) setTodayTasks(todayRes.data);
    if (allRes.data) setAllTasks(allRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setPendingQuotesCount(quotesCount.count ?? 0);
    if (roomsRes.data) setCurrentRooms(roomsRes.data);
    try { localStorage.setItem('rf-active-project', project.id); } catch {}
    setSwitching(false);
  }, [currentProject, allProjectsMode]);

  // On mount, restore last-selected project from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf-active-project');
      if (saved === '__all__') {
        switchToAll();
      } else if (saved && saved !== currentProject?.id) {
        const found = allProjects.find((p) => p.id === saved);
        if (found) switchProject(found);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const DEFAULT_ORDER = ['budget', 'aitip'];
  const [cardOrder, setCardOrder] = useState<string[]>(DEFAULT_ORDER);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rf-card-order');
      if (saved) {
        const parsed = (JSON.parse(saved) as string[]).filter(k => DEFAULT_ORDER.includes(k));
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
    // Expenses: use e.date (user-specified local YYYY-MM-DD); fall back to created_at as local date
    expenses.forEach(e => {
      const d = (e as { date?: string }).date || (e.created_at ? localDateStr(new Date(e.created_at)) : null);
      if (d) s.add(d);
    });
    // Tasks: count creation date AND completion date (convert UTC ISO → local date)
    allTasks.forEach(t => {
      if (t.created_at)   s.add(localDateStr(new Date(t.created_at)));
      if (t.completed_at) s.add(localDateStr(new Date(t.completed_at)));
    });
    return s;
  }, [expenses, allTasks]);

  // Nearest future room deadline for snapshot card
  const nextDeadline = useMemo(() => {
    const today = localDateStr();
    return currentRooms
      .filter(r => r.end_date && r.end_date >= today)
      .sort((a, b) => (a.end_date ?? '').localeCompare(b.end_date ?? ''))
      .at(0) ?? null;
  }, [currentRooms]);

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

  // Upcoming tasks (due after today, not completed, sorted by due_date)
  // Note: inline the completion check here — isTaskCompleted is defined later in the component
  const upcomingTasks = useMemo(() => {
    const today = localDateStr();
    return allTasks
      .filter(t => t.due_date && t.due_date > today && t.status !== 'voltooid' && t.status !== 'done')
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
      .slice(0, 3);
  }, [allTasks]);

  const fetchAiTip = useCallback(async (force = false) => {
    const cacheKey = `rf-ai-tip-${currentProject?.id ?? 'none'}`;
    if (!force) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          setAiTip(parsed.tip);
          setAiTipAction(parsed.action ?? null);
          return;
        }
      } catch {}
    }
    setAiTipLoading(true);
    try {
      const nextDeadlineStr = nextDeadline?.end_date
        ? new Date(nextDeadline.end_date + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
        : null;
      const endDateStr = currentProject?.end_date
        ? new Date(currentProject.end_date + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
        : null;
      const res = await fetch('/api/ai-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetPct:      budget > 0 ? Math.round((expenses.reduce((s, e) => s + Number(e.amount), 0) / budget) * 100) : null,
          todayTaskCount: todayTasks.length,
          openQuotes:     pendingQuotesCount,
          nextDeadline:   nextDeadlineStr,
          endDate:        endDateStr,
          projectType:    currentProject?.type ?? null,
          projectId:      currentProject?.id ?? null,
        }),
      });
      const json = await res.json();
      if (json.tip) {
        setAiTip(json.tip);
        if (json.actionLink) setAiTipAction(json.actionLink);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ tip: json.tip, action: json.actionLink ?? null })); } catch {}
      }
    } catch { /* silent */ } finally {
      setAiTipLoading(false);
    }
  }, [currentProject, budget, expenses, todayTasks, pendingQuotesCount, nextDeadline]);

  // Load AI tip on mount
  useEffect(() => { fetchAiTip(); }, [fetchAiTip]);

  // Load woningwaarde on mount
  useEffect(() => {
    if (!house) return;
    setWoningLoading(true);
    const params = new URLSearchParams();
    if (house.purchase_price) params.set('purchase_price', String(house.purchase_price));
    if (house.purchase_date)  params.set('purchase_date',  house.purchase_date);
    fetch(`/api/woningwaarde?${params}`)
      .then(r => r.json())
      .then(setWoningData)
      .catch(() => {})
      .finally(() => setWoningLoading(false));
  }, [house]);

  useEffect(() => {
    const loadWoonkosten = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Get all house IDs for the user
        const { data: houses } = await supabase.from('houses').select('id').eq('user_id', user.id);
        const houseIds = (houses || []).map((h: { id: string }) => h.id);
        // All project expenses (verbouwing)
        const projectIds = allProjects.map(p => p.id);
        const [onderhoudRes, expRes] = await Promise.all([
          houseIds.length > 0 ? supabase.from('onderhoud_kosten').select('amount, category').in('house_id', houseIds) : Promise.resolve({ data: [] }),
          projectIds.length > 0 ? supabase.from('expenses').select('amount').in('project_id', projectIds) : Promise.resolve({ data: [] }),
        ]);
        const cats: Record<string, number> = { verbouwing: 0 };
        (expRes.data || []).forEach((e: { amount: number }) => { cats.verbouwing = (cats.verbouwing || 0) + Number(e.amount); });
        (onderhoudRes.data || []).forEach((k: { amount: number; category: string }) => {
          cats[k.category] = (cats[k.category] || 0) + Number(k.amount);
        });
        const total = Object.values(cats).reduce((s, v) => s + v, 0);
        setWoonkosten({ total, categories: cats });
      } catch { /* silent */ }
    };
    loadWoonkosten();
  }, [allProjects]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setUpgradedBanner(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const refreshTasks = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!currentProject) return;
    const today = localDateStr();
    const [todayRes, allRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', currentProject.id).eq('due_date', today),
      supabase.from('tasks').select('*').eq('project_id', currentProject.id).order('created_at', { ascending: false }),
    ]);
    if (todayRes.data) setTodayTasks(todayRes.data);
    if (allRes.data) setAllTasks(allRes.data);
  }, [currentProject]);

  const refreshExpenses = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!currentProject) return;
    const { data } = await supabase.from('expenses').select('*').eq('project_id', currentProject.id).order('created_at', { ascending: false });
    if (data) setExpenses(data);
  }, [currentProject]);

  const refreshQuotes = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!currentProject) return;
    const { count } = await supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('project_id', currentProject.id).in('status', ['in_behandeling', 'pending']);
    setPendingQuotesCount(count ?? 0);
  }, [currentProject]);

  useEffect(() => {
    if (!currentProject) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-${currentProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${currentProject.id}` }, () => refreshTasks(supabase))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `project_id=eq.${currentProject.id}` }, () => refreshExpenses(supabase))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes', filter: `project_id=eq.${currentProject.id}` }, () => refreshQuotes(supabase))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentProject, refreshTasks, refreshExpenses, refreshQuotes]);

  // Refresh tasks when user returns to this tab (e.g. added a task in the project view)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && currentProject) {
        const supabase = createClient();
        refreshTasks(supabase);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentProject, refreshTasks]);

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
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const completedTodayCount = todayTasks.filter(t => isTaskCompleted(t)).length;

  // ── Stat card definitions ────────────────────────────────────────────────────
  const cardContent: Record<string, React.ReactNode> = {
    budget: (
      <div
        className="rounded-2xl p-3 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#D1E8DC', boxShadow: '0 4px 24px rgba(40,135,96,0.12), 0 1px 4px rgba(0,0,0,0.04)', border: '1px solid #D1E8DC' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Budget</p>
        <div className="flex flex-col items-center mb-2">
          <DonutGauge percentage={budgetPercentage} color={budgetColor} />
          <p className="text-[10px] text-center mt-1" style={{ color: '#9CA3AF' }}>
            {budgetPercentage}% van budget gebruikt
          </p>
          {budget > 0 && (
            <p className="text-[10px] text-center" style={{ color: '#6B7280' }}>
              {formatShort(totalExpenses)} van {formatShort(budget)}
            </p>
          )}
        </div>
        {budget === 0 && (
          <Link href={currentProject ? `/projects/${currentProject.id}?tab=instellingen` : '/projects'}
            className="text-[10px] font-semibold mt-auto text-center block" style={{ color: '#288760' }}>
            Stel budget in →
          </Link>
        )}
        {budget > 0 && (
          <div className="mt-auto space-y-1">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F3F4F6' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${budgetPercentage}%`, backgroundColor: budgetColor }} />
            </div>
            <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{formatShort(Math.max(budget - totalExpenses, 0))} resterend</p>
          </div>
        )}
      </div>
    ),
    aitip: (
      <div
        className="rounded-2xl p-3 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} style={{ color: '#288760' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>AI-advies</span>
          </div>
          <button onClick={() => fetchAiTip(true)} disabled={aiTipLoading} className="p-0.5 rounded disabled:opacity-40" title="Vernieuwen">
            <svg className={`w-3 h-3 ${aiTipLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#C4CACC' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="flex-1">
          {aiTipLoading && !aiTip ? (
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ backgroundColor: '#288760', animationDelay: `${i * 0.15}s`, opacity: 0.6 }} />
              ))}
            </div>
          ) : aiTip ? (
            <>
              <p className="text-xs leading-snug" style={{ color: '#374151', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{aiTip}</p>
              {aiTipAction && (
                <Link href={aiTipAction.href} className="text-xs font-semibold mt-2 inline-block" style={{ color: '#288760' }}>
                  {aiTipAction.label}
                </Link>
              )}
            </>
          ) : (
            <p className="text-xs" style={{ color: '#C4CACC' }}>
              {allProjects.length === 0 ? 'Voeg een project toe voor tips' : 'Laden...'}
            </p>
          )}
        </div>
      </div>
    ),
    offertes: (() => {
      const CAT_COLORS: Record<string, string> = {
        verbouwing: '#288760', onderhoud: '#3B82F6', reparatie: '#F59E0B',
        tuin: '#10B981', verzekering: '#8B5CF6', energie: '#EC4899',
        belasting: '#6B7280', overig: '#94A3B8',
      };
      const CAT_LABELS: Record<string, string> = {
        verbouwing: 'Verbouwing', onderhoud: 'Onderhoud', reparatie: 'Reparatie',
        tuin: 'Tuin', verzekering: 'Verzekering', energie: 'Energie',
        belasting: 'Belasting', overig: 'Overig',
      };
      const total = woonkosten?.total ?? 0;
      const cats = woonkosten?.categories ?? {};
      const sorted = Object.entries(cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3);
      return (
        <div className="rounded-2xl p-3 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Woonkosten</p>
          {total === 0 ? (
            <>
              <p className="text-xl font-black mb-1" style={{ color: '#D1D5DB' }}>€ 0</p>
              <p className="text-xs flex-1" style={{ color: '#9CA3AF' }}>Nog geen kosten</p>
              <Link href="/woningkosten" className="text-[11px] font-semibold mt-auto" style={{ color: '#288760' }}>Voeg kosten toe →</Link>
            </>
          ) : (
            <>
              <p className="text-xl font-black leading-tight mb-2" style={{ color: '#1A1A1A' }}>{formatShort(total)}</p>
              {/* Segmented bar */}
              {sorted.length > 0 && (
                <div className="w-full h-1.5 rounded-full overflow-hidden flex mb-2">
                  {sorted.map(([cat, val]) => (
                    <div key={cat} style={{ width: `${(val / total) * 100}%`, backgroundColor: CAT_COLORS[cat] ?? '#94A3B8', minWidth: val > 0 ? '2px' : 0 }} />
                  ))}
                </div>
              )}
              {/* Top 3 legend */}
              <div className="space-y-0.5 flex-1">
                {top3.map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[cat] ?? '#94A3B8' }} />
                    <span className="text-[10px] truncate flex-1" style={{ color: '#6B7280' }}>{CAT_LABELS[cat] ?? cat}</span>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: '#374151' }}>{formatShort(val)}</span>
                  </div>
                ))}
              </div>
              <Link href="/woningkosten" className="text-[11px] font-semibold mt-2" style={{ color: '#288760' }}>Bekijk woonkosten →</Link>
            </>
          )}
        </div>
      );
    })(),
    vandaag: (() => {
      // Build snapshot rows from available data — hide empty ones
      const fmtDeadline = (d: string) => {
        const [y, m, day] = d.split('-').map(Number);
        return new Date(y, m - 1, day).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
      };
      const rows: { icon: React.ReactNode; label: string; value: string; accent: string }[] = [];

      if (nextDeadline?.end_date) rows.push({
        accent: '#F59E0B',
        label: 'Volgende deadline',
        value: `${nextDeadline.name} · ${fmtDeadline(nextDeadline.end_date)}`,
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      });
      if (pendingQuotesCount > 0) rows.push({
        accent: '#F59E0B',
        label: 'Openstaande offertes',
        value: `${pendingQuotesCount} wacht${pendingQuotesCount === 1 ? '' : 'en'} op reactie`,
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      });
      if (todayTasks.length > 0) rows.push({
        accent: '#3B82F6',
        label: 'Taken vandaag',
        value: `${completedTodayCount}/${todayTasks.length} voltooid`,
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      });
      if (budget > 0 && budgetPercentage >= 75) rows.push({
        accent: '#EF4444',
        label: 'Budget bijna op',
        value: `${budgetPercentage}% gebruikt`,
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      });
      if (budget > 0 && budgetPercentage < 75) rows.push({
        accent: '#288760',
        label: 'Budget resterend',
        value: formatCurrency(Math.max(budget - totalExpenses, 0)),
        icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      });
      return (
        <div
          className="rounded-2xl p-4 sm:p-5 border flex flex-col h-full transition-all duration-200 hover:-translate-y-0.5"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Vandaag</p>
          </div>
          {rows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Alles op orde</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Geen openstaande punten</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-2.5">
              {rows.slice(0, 3).map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0" style={{ color: '#1a6b4a' }}>
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{row.label}</p>
                    <p className="text-xs font-semibold truncate" style={{ color: '#1A1A1A' }}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })(),
  };

  return (
    <div className="min-h-full overflow-x-hidden" style={{ background: 'linear-gradient(160deg, #F8FAF9 0%, #FAFAFA 100%)' }}>
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
          className="rounded-2xl p-4 sm:p-7 relative overflow-hidden"
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
            <div className="flex-1 min-w-0">
              {/* Project switcher */}
              {allProjects.length > 1 && (
                <>
                  <style>{`
                    .proj-pill { transition: background 0.15s, border-color 0.15s; cursor: pointer; }
                    .proj-pill:hover:not(:disabled) { background-color: rgba(255,255,255,0.22) !important; border-color: rgba(255,255,255,0.5) !important; }
                    .proj-pill.proj-active { background-color: rgba(255,255,255,0.93) !important; color: #1a3a2a !important; border-color: transparent !important; }
                    .proj-pill.proj-active:hover { background-color: white !important; }
                    .proj-pill-all { transition: background 0.15s, border-color 0.15s; cursor: pointer; }
                    .proj-pill-all:hover:not(:disabled) { background-color: rgba(110,231,183,0.25) !important; border-color: rgba(110,231,183,0.6) !important; }
                    .proj-pill-all.proj-all-active { background-color: rgba(110,231,183,0.25) !important; color: #6EE7B7 !important; border-color: rgba(110,231,183,0.5) !important; }
                    .proj-pill-all.proj-all-active:hover { background-color: rgba(110,231,183,0.35) !important; }
                    .proj-select option { background-color: #1a3a2a; color: white; }
                  `}</style>

                  {/* Mobile: compact dropdown + alle projecten button */}
                  <div className="sm:hidden flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <select
                        value={allProjectsMode ? '__all__' : (currentProject?.id ?? '')}
                        onChange={(e) => {
                          if (e.target.value === '__all__') switchToAll();
                          else {
                            const p = allProjects.find(proj => proj.id === e.target.value);
                            if (p) switchProject(p);
                          }
                        }}
                        disabled={switching}
                        className="proj-select w-full text-xs font-semibold pl-3 pr-7 py-1.5 rounded-xl border appearance-none"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.10)',
                          color: 'white',
                          borderColor: 'rgba(255,255,255,0.2)',
                          outline: 'none',
                        }}
                      >
                        {allProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        <option value="__all__">Alle projecten</option>
                      </select>
                      <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Desktop: pill row */}
                  <div className="hidden sm:flex items-center gap-1.5 mb-3 flex-wrap pb-0.5">
                    <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none', overflow: 'visible' }}>
                      <button
                        onClick={switchToAll}
                        disabled={switching}
                        className={`proj-pill-all shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border${allProjectsMode ? ' proj-all-active' : ''}`}
                        style={{
                          backgroundColor: allProjectsMode ? 'rgba(110,231,183,0.25)' : 'rgba(255,255,255,0.06)',
                          color: allProjectsMode ? '#6EE7B7' : 'rgba(255,255,255,0.45)',
                          borderColor: allProjectsMode ? 'rgba(110,231,183,0.5)' : 'rgba(255,255,255,0.12)',
                        }}
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Alle projecten
                      </button>
                      {allProjects.map(p => {
                        const isActive = !allProjectsMode && currentProject?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => switchProject(p)}
                            disabled={switching}
                            className={`proj-pill shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border${isActive ? ' proj-active' : ''}`}
                            style={{
                              backgroundColor: isActive ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.08)',
                              color: isActive ? '#1a3a2a' : 'rgba(255,255,255,0.6)',
                              borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.18)',
                            }}
                          >
                            {isActive && (
                              <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                            )}
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {allProjectsMode ? (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#6EE7B7', boxShadow: '0 0 6px rgba(110,231,183,0.8)' }} />
                  <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>
                    {allProjects.length} projecten · Totaaloverzicht
                  </span>
                </div>
              ) : currentProject ? (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)', animation: 'pulse 2s infinite' }} />
                  <span className="text-xs font-semibold" style={{ color: '#6EE7B7' }}>
                    {currentProject.name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: 'rgba(40,135,96,0.25)', color: '#86EFAC' }}
                  >
                    {currentProject.status}
                  </span>
                </div>
              ) : null}
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {greeting}, {profile?.name?.split(' ')[0] || 'daar'}! 👋
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {allProjectsMode
                  ? `Gecombineerde data van al je verbouwingsprojecten`
                  : currentProject
                  ? `${currentProject.type.charAt(0).toUpperCase() + currentProject.type.slice(1).replace('_', ' ')} · Gestart ${currentProject.start_date ? new Date(currentProject.start_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }) : 'onbekend'}`
                  : 'Start je eerste verbouwingsproject om te beginnen.'}
              </p>
            </div>

            {/* Right: key stats */}
            {currentProject && budget > 0 && (
              <div className="hidden sm:flex items-center gap-5 sm:gap-7">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-black text-white">{budgetPercentage}%</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>gebruikt</p>
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
            {!currentProject && !allProjectsMode && (
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

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
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

        {/* ── Bottom section ── */}
        <div className="space-y-4">

        {/* Row 1: Taken + Kostenverdeling */}
        <div className="grid lg:grid-cols-2 gap-4 items-start">

          {/* ── Taken vandaag + Binnenkort ── */}
          <div
            className="rounded-2xl bg-white border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <h2 className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>Vandaag</h2>
            </div>

            {/* Vandaag lijst */}
            <div className="px-5 pb-4">
              {todayTasks.length === 0 ? (
                <div
                  className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{ border: '1.5px dashed #E5E7EB' }}
                >
                  <div className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: '#D1D5DB', borderStyle: 'dashed' }} />
                  <span className="text-sm" style={{ color: '#C4CACC' }}>Geen taken vandaag</span>
                </div>
              ) : (
                <ul className="space-y-1">
                  {todayTasks.map(task => {
                    const done = isTaskCompleted(task);
                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
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

            {/* Binnenkort sectie */}
            <div style={{ backgroundColor: '#F4F7F5', borderTop: '1.5px solid #E5E7EB' }}>
              <div className="flex items-center gap-1.5 px-5 pt-3 pb-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#6B7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Binnenkort</p>
              </div>
              {upcomingTasks.length > 0 ? (
                <ul className="px-5 pb-4 space-y-2">
                  {upcomingTasks.map(task => {
                    const [y, m, d] = (task.due_date ?? '').split('-').map(Number);
                    const label = task.due_date
                      ? new Date(y, m - 1, d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                      : '';
                    return (
                      <li key={task.id} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: '#9CA3AF' }} />
                        <span className="text-sm flex-1 truncate" style={{ color: '#374151' }}>{task.title}</span>
                        {label && (
                          <span className="text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-lg" style={{ color: '#288760', backgroundColor: '#DCF5EA' }}>
                            {label}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-5 pb-4 text-sm" style={{ color: '#C4CACC' }}>Geen geplande taken</p>
              )}
            </div>
          </div>

          {/* Kostenverdeling */}
          <WoningkostenCard data={woonkosten} />

        </div>{/* end row 1 */}

        {/* Row 2: Woningwaarde – full width */}
        <WoningwaardeCard house={house} data={woningData} loading={woningLoading} />

        {/* Empty project state */}
        {!currentProject && !allProjectsMode && allProjects.length === 0 && (
          <div className="rounded-2xl p-5 sm:p-6 bg-white border text-center" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>Geen actief project</h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Maak je eerste verbouwingsproject aan om te beginnen.</p>
            <Link href="/projects" className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#288760' }}>Project aanmaken</Link>
          </div>
        )}

        {/* Row 3: Gantt – full width */}
        {allProjectsMode ? (
          allProjects.filter(p => currentRooms.some(r => r.project_id === p.id)).length > 0 && (
            <div className="rounded-2xl p-5 sm:p-6 bg-white border overflow-hidden" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-5" style={{ color: '#9CA3AF' }}>Planning — alle projecten</h2>
              <div className="space-y-6">
                {allProjects.filter(p => currentRooms.some(r => r.project_id === p.id)).map(p => {
                  const pRooms = currentRooms.filter(r => r.project_id === p.id);
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold" style={{ color: '#374151' }}>{p.name}</p>
                        <Link href={`/projects/${p.id}?tab=overzicht`} className="text-xs font-semibold" style={{ color: '#288760' }}>Bekijk →</Link>
                      </div>
                      <GanttChart rooms={pRooms} projectStart={p.start_date} projectEnd={p.end_date} compact />
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          currentProject && currentRooms.length > 0 && (
            <div
              className="rounded-2xl p-5 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
              style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Planning</h2>
                <Link href={`/projects/${currentProject.id}?tab=overzicht#planning`} className="text-xs font-semibold" style={{ color: '#288760' }}>
                  Bewerk planning →
                </Link>
              </div>
              <GanttChart
                rooms={currentRooms}
                projectStart={currentProject.start_date}
                projectEnd={currentProject.end_date}
                compact
              />
            </div>
          )
        )}

        {/* Compact streak banner */}
        {currentProject && (
          <div
            className="rounded-2xl px-5 py-3.5 bg-white border flex items-center gap-4 overflow-hidden"
            style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #3b0764, #4c0d87)', boxShadow: '0 2px 8px rgba(109,40,217,0.2)' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#C4B5FD' }}>
                  <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                  {currentStreak} {currentStreak === 1 ? 'dag' : 'dagen'} op rij 🔥
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{activeDays} actieve dag{activeDays === 1 ? '' : 'en'} totaal</p>
              </div>
              {/* Week dots — hidden on mobile to prevent overflow */}
              <div className="hidden sm:flex gap-1 ml-2">
                {['M','D','W','D','V','Z','Z'].map((label, i) => {
                  const today = localDateStr();
                  const [ty, tm, td] = today.split('-').map(Number);
                  const todayDate = new Date(ty, tm - 1, td);
                  const dow = (todayDate.getDay() + 6) % 7;
                  const monday = new Date(ty, tm - 1, td - dow);
                  const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
                  const dateStr = localDateStr(d);
                  const has = activeDates.has(dateStr);
                  const isToday = dateStr === today;
                  const isFuture = d > todayDate;
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <div
                        className="w-4 h-4 rounded-sm"
                        style={{
                          backgroundColor: isToday ? '#A855F7' : has ? '#7C3AED' : isFuture ? 'rgba(167,139,250,0.1)' : '#E5E7EB',
                          boxShadow: isToday ? '0 0 6px rgba(168,85,247,0.5)' : 'none',
                          opacity: isFuture ? 0.3 : 1,
                        }}
                      />
                      <span className="hidden sm:block" style={{ fontSize: '7px', color: '#C4B5FD', fontWeight: 700 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="ml-auto">
                <Link href="/streak" className="text-xs font-semibold" style={{ color: '#9333EA' }}>Bekijk streak →</Link>
              </div>
            </div>
          )}

        {/* Recente activiteit */}
        <div
          className="rounded-2xl p-5 sm:p-6 bg-white border transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
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
                  const d = activity.description.toLowerCase();
                  // Resolve icon + colors per activity type/description
                  let bg = '#F3F4F6', color = '#6B7280';
                  let icon: React.ReactNode = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4" /></svg>
                  );
                  if (activity.type === 'expense' || d.startsWith('kosten')) {
                    bg = '#F0FDF4'; color = '#16A34A';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                  } else if (d.includes('voltooid')) {
                    bg = '#EFF6FF'; color = '#3B82F6';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
                  } else if (d.includes('taak aangemaakt') || d.includes('taak')) {
                    bg = '#F0FDF4'; color = '#288760';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12v4m0 0h-2m2 0h2" /></svg>;
                  } else if (d.includes('geaccepteerd')) {
                    bg = '#ECFDF5'; color = '#059669';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                  } else if (d.includes('offerte')) {
                    bg = '#FFF7ED'; color = '#EA580C';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
                  } else if (d.includes('aannemer')) {
                    bg = '#FEF3C7'; color = '#D97706';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
                  } else if (d.includes('meerwerk')) {
                    bg = '#FFF1F2'; color = '#E11D48';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
                  } else if (d.includes('foto')) {
                    bg = '#F0F9FF'; color = '#0284C7';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
                  } else if (d.includes('document')) {
                    bg = '#F5F3FF'; color = '#7C3AED';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
                  } else if (d.includes('deadline')) {
                    bg = '#FFFBEB'; color = '#D97706';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                  } else if (d.includes('budget')) {
                    bg = '#FEF2F2'; color = '#DC2626';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
                  } else if (d.includes('ruimte')) {
                    bg = '#F0FDF4'; color = '#16A34A';
                    icon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>;
                  }
                  return (
                    <li key={activity.id} className="flex items-start gap-0">
                      <div className="flex flex-col items-center mr-3 shrink-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg, color }}>
                          {icon}
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

        </div>{/* end space-y-4 */}
      </div>

      </div>{/* end max-w-7xl wrapper */}
    </div>
  );
}
