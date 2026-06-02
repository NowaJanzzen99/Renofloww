'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Project, Task, Expense, Room } from '@/types';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { KostenVerdelingDonut } from '@/components/KostenVerdelingDonut';

// ── Brand palette ─────────────────────────────────────────────────────────────
const GREEN = '#288760';
const GREEN_LIGHT = '#4ade80';
const GREEN_PALE = '#B7E5BA';

const CATEGORY_COLORS: Record<string, string> = {
  materiaal: '#288760',
  arbeid: '#3EAA7A',
  vergunning: '#6EC99B',
  transport: '#1A5140',
  overig: '#9CA3AF',
};
const CATEGORY_LABELS: Record<string, string> = {
  materiaal: 'Materiaal',
  arbeid: 'Arbeid',
  vergunning: 'Vergunning',
  transport: 'Transport',
  overig: 'Overig',
};
const CATEGORY_ICONS: Record<string, string> = {
  materiaal: '🧱', arbeid: '👷', vergunning: '📋', transport: '🚚', overig: '📦',
};

// ── Local date helper ─────────────────────────────────────────────────────────
function localDateStr(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Smooth ring progress (SVG) ────────────────────────────────────────────────
function RingProgress({ pct, color, size = 120, strokeWidth = 10 }: { pct: number; color: string; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-xl" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', minWidth: 140 }}>
      {label && <p className="font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: '#6B7280' }}>{p.name}</span>
          <span className="font-semibold" style={{ color: p.color || '#1A1A1A' }}>
            {typeof p.value === 'number' && p.name.toLowerCase().includes('euro') || p.name.toLowerCase().includes('kosten') || p.name.toLowerCase().includes('budget') || p.name.toLowerCase().includes('uitgegeven')
              ? formatCurrency(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { category: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-xl" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
      <p className="font-semibold" style={{ color: '#1A1A1A' }}>{p.name}</p>
      <p style={{ color: '#6B7280' }}>{formatCurrency(p.value)}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h = 160, className = '' }: { h?: number; className?: string }) {
  return <div className={`animate-pulse rounded-2xl ${className}`} style={{ height: h, backgroundColor: '#F3F4F6' }} />;
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ALL_ID = '__all__';

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setProjects(data || []);
        // Default to ALL when multiple projects, else first project
        if (data && data.length > 1) setSelectedProjectId(ALL_ID);
        else if (data && data.length > 0) setSelectedProjectId(data[0].id);
      } catch { setError('Kon projecten niet laden.'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        if (selectedProjectId === ALL_ID) {
          const ids = projects.map(p => p.id);
          if (ids.length === 0) { setLoading(false); return; }
          const [tasksRes, expensesRes, roomsRes] = await Promise.all([
            supabase.from('tasks').select('*').in('project_id', ids),
            supabase.from('expenses').select('*').in('project_id', ids).order('date'),
            supabase.from('rooms').select('*').in('project_id', ids),
          ]);
          setTasks(tasksRes.data || []);
          setExpenses(expensesRes.data || []);
          setRooms(roomsRes.data || []);
        } else {
          const [tasksRes, expensesRes, roomsRes] = await Promise.all([
            supabase.from('tasks').select('*').eq('project_id', selectedProjectId),
            supabase.from('expenses').select('*').eq('project_id', selectedProjectId).order('date'),
            supabase.from('rooms').select('*').eq('project_id', selectedProjectId),
          ]);
          setTasks(tasksRes.data || []);
          setExpenses(expensesRes.data || []);
          setRooms(roomsRes.data || []);
        }
      } catch { setError('Kon analysegegevens niet laden.'); }
      finally { setLoading(false); }
    };
    load();
  }, [selectedProjectId, projects]);

  const isAllMode = selectedProjectId === ALL_ID;
  const selectedProject = isAllMode ? null : projects.find((p) => p.id === selectedProjectId);
  const budget = isAllMode
    ? projects.reduce((s, p) => s + (Number(p.budget) || 0), 0)
    : Number(selectedProject?.budget) || 0;

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === 'voltooid' || t.status === 'done').length, [tasks]);
  const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const budgetPct = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetColor = budgetPct >= 80 ? '#EF4444' : budgetPct >= 50 ? '#F59E0B' : GREEN;

  // ── Budget area chart (cumulative) ─────────────────────────────────────────
  const budgetChartData = useMemo(() => {
    let cumul = 0;
    const grouped: Record<string, number> = {};
    expenses.forEach((e) => {
      const date = e.date || e.created_at.split('T')[0];
      grouped[date] = (grouped[date] || 0) + Number(e.amount);
    });
    const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    // Prepend start point at 0
    const result = [];
    if (selectedProject?.start_date && entries.length > 0 && entries[0][0] > selectedProject.start_date) {
      result.push({ date: selectedProject.start_date.slice(5), cumul: 0, budget });
    }
    entries.forEach(([date, amount]) => {
      cumul += amount;
      result.push({ date: date.slice(5), cumul: Math.round(cumul), budget });
    });
    return result;
  }, [expenses, budget, selectedProject]);

  // ── Category breakdown ──────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const acc: Record<string, number> = {};
    expenses.forEach((e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); });
    return Object.entries(acc)
      .map(([category, amount]) => ({
        name: `${CATEGORY_ICONS[category] || ''} ${CATEGORY_LABELS[category] || category}`,
        displayName: CATEGORY_LABELS[category] || category,
        icon: CATEGORY_ICONS[category] || '📦',
        category,
        value: Math.round(amount),
        pct: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, totalExpenses]);

  // ── Last 14 days task activity ──────────────────────────────────────────────
  const dailyTaskData = useMemo(() => {
    const today = localDateStr();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = localDateStr(d);
      const dayLabel = d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
      const completed = tasks.filter((t) => t.completed_at && t.completed_at.split('T')[0] === dateStr).length;
      const created = tasks.filter((t) => t.created_at && t.created_at.split('T')[0] === dateStr).length;
      return { date: dayLabel, Voltooid: completed, Aangemaakt: created, isToday: dateStr === today };
    });
  }, [tasks]);

  // ── Room progress ───────────────────────────────────────────────────────────
  const roomProgress = useMemo(() => rooms.map((room) => {
    const rt = tasks.filter((t) => t.room_id === room.id);
    const done = rt.filter((t) => t.status === 'voltooid' || t.status === 'done').length;
    return { ...room, total: rt.length, done, pct: rt.length > 0 ? Math.round((done / rt.length) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct), [rooms, tasks]);

  const isEmpty = tasks.length === 0 && expenses.length === 0;

  // ── Project health score ────────────────────────────────────────────────────
  const healthScore = useMemo(() => {
    if (tasks.length === 0 && budget === 0) return null;
    let score = 0;
    let factors = 0;
    if (tasks.length > 0) { score += taskPct; factors++; }
    if (budget > 0) { score += Math.max(0, 100 - budgetPct); factors++; }
    return factors > 0 ? Math.round(score / factors) : null;
  }, [tasks.length, budget, taskPct, budgetPct]);

  const healthLabel = healthScore === null ? null
    : healthScore >= 80 ? { text: 'Uitstekend', color: GREEN }
    : healthScore >= 60 ? { text: 'Goed', color: '#4ade80' }
    : healthScore >= 40 ? { text: 'Redelijk', color: '#F59E0B' }
    : { text: 'Aandacht nodig', color: '#EF4444' };

  return (
    <div className="min-h-full" style={{ background: '#F8FAFB' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div
          className="rounded-2xl p-5 sm:p-7 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 45%, #1e4d36 100%)', boxShadow: '0 8px 32px rgba(13,31,26,0.3)' }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(40,135,96,0.22) 0%, transparent 70%)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6EE7B7' }}>Voortgang & Analyse</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {isAllMode ? 'Alle projecten' : (selectedProject?.name || 'Project')}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isAllMode
                  ? `Gecombineerde analyse van ${projects.length} project${projects.length !== 1 ? 'en' : ''}`
                  : selectedProject?.start_date
                  ? `Gestart ${new Date(selectedProject.start_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}${selectedProject.end_date ? ` · Einddatum ${new Date(selectedProject.end_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}` : ''}`
                  : ''}
              </p>
            </div>
            {/* Project selector */}
            {projects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 self-start">
                {/* Alle projecten pill */}
                <button
                  onClick={() => setSelectedProjectId(ALL_ID)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isAllMode ? 'rgba(110,231,183,0.25)' : 'rgba(255,255,255,0.08)',
                    color: isAllMode ? '#6EE7B7' : 'rgba(255,255,255,0.5)',
                    border: isAllMode ? '1px solid rgba(110,231,183,0.4)' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Alle
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: selectedProjectId === p.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.08)',
                      color: selectedProjectId === p.id ? '#1a3a2a' : 'rgba(255,255,255,0.6)',
                      border: selectedProjectId === p.id ? '1px solid transparent' : '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key numbers bar */}
          {!loading && (
            <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {[
                { label: 'Taken voltooid', value: `${completedTasks}/${tasks.length}`, accent: GREEN_PALE },
                { label: 'Budget gebruikt', value: budget > 0 ? `${budgetPct}%` : '—', accent: budgetPct >= 80 ? '#FCA5A5' : GREEN_PALE },
                { label: 'Totale kosten', value: formatCurrency(totalExpenses), accent: GREEN_PALE },
                { label: 'Ruimtes', value: `${rooms.length}`, accent: GREEN_PALE },
                ...(healthScore !== null ? [{ label: 'Project score', value: `${healthScore}`, accent: healthLabel?.color || GREEN_PALE }] : []),
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
                  <p className="text-xl font-black" style={{ color: s.accent }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-7xl">

        {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>{error}</div>}

        {!loading && isEmpty ? (
          <div className="text-center py-16 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Nog geen data</h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>Voeg taken en kosten toe aan je project om hier statistieken te zien.</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Row 1: task ring + budget gauge ─────────────────────────── */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Task ring */}
              <div className="rounded-2xl bg-white border p-5 flex flex-col" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Taakvoortgang</p>
                {loading ? <Skel h={140} /> : (
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <RingProgress pct={taskPct} color={taskPct === 100 ? GREEN_LIGHT : GREEN} size={100} strokeWidth={9} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xl font-black" style={{ color: taskPct === 100 ? GREEN_LIGHT : GREEN }}>{taskPct}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-3xl font-black mb-1" style={{ color: '#1A1A1A' }}>{completedTasks}<span className="text-lg font-semibold" style={{ color: '#9CA3AF' }}>/{tasks.length}</span></p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>taken voltooid</p>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: GREEN }} />
                          <span style={{ color: '#6B7280' }}>Voltooid: {completedTasks}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#E5E7EB' }} />
                          <span style={{ color: '#6B7280' }}>Open: {tasks.length - completedTasks}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget gauge */}
              <div className="rounded-2xl bg-white border p-5 flex flex-col" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Budget</p>
                {loading ? <Skel h={140} /> : budget === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>Geen budget ingesteld</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <RingProgress pct={budgetPct} color={budgetColor} size={100} strokeWidth={9} />
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xl font-black" style={{ color: budgetColor }}>{budgetPct}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{formatCurrency(totalExpenses)}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>van {formatCurrency(budget)}</p>
                      <div className="mt-3">
                        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#F3F4F6' }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${budgetPct}%`, backgroundColor: budgetColor }} />
                        </div>
                        <p className="text-xs mt-1.5 font-medium" style={{ color: GREEN }}>
                          {formatCurrency(Math.max(budget - totalExpenses, 0))} resterend
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Project health */}
              {healthScore !== null ? (
                <div className="rounded-2xl p-5 flex flex-col" style={{ background: 'linear-gradient(135deg, #0d1f1a 0%, #1a3a2a 100%)', boxShadow: '0 4px 20px rgba(13,31,26,0.25)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Project score</p>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative shrink-0">
                      <RingProgress pct={healthScore} color={healthLabel?.color || GREEN} size={100} strokeWidth={9} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black text-white">{healthScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-black" style={{ color: healthLabel?.color || GREEN_PALE }}>{healthLabel?.text}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>Gebaseerd op taken en budget</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white border p-5 flex items-center justify-center" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                  <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>Voeg taken en budget toe voor een project score</p>
                </div>
              )}
            </div>

            {/* ── Row 2: budget timeline ───────────────────────────────────── */}
            {(budget > 0 || budgetChartData.length > 0) && (
              <div className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Budget ontwikkeling</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Cumulatieve uitgaven in de tijd</p>
                  </div>
                  {budget > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5" style={{ backgroundColor: GREEN }} />
                        <span style={{ color: '#6B7280' }}>Uitgegeven</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: '#EF4444' }} />
                        <span style={{ color: '#6B7280' }}>Budget limiet</span>
                      </div>
                    </div>
                  )}
                </div>
                {loading ? <Skel h={220} /> : budgetChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>Nog geen kosten geregistreerd</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={budgetChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GREEN} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={GREEN} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      {budget > 0 && <ReferenceLine y={budget} stroke="#EF4444" strokeDasharray="5 4" strokeWidth={1.5} />}
                      <Area type="monotone" dataKey="cumul" name="Uitgegeven" stroke={GREEN} strokeWidth={2.5} fill="url(#budgetGrad)" dot={budgetChartData.length === 1 ? { fill: GREEN, r: 5 } : false} activeDot={{ fill: GREEN, r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* ── Row 3: cost breakdown + task activity ───────────────────── */}
            <div className="grid lg:grid-cols-2 gap-5">

              {/* Cost breakdown */}
              <div className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#9CA3AF' }}>Kostenverdeling</p>
                {loading ? <Skel h={180} /> : categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>Nog geen kosten geregistreerd</p>
                  </div>
                ) : (
                  <KostenVerdelingDonut
                    items={categoryData.map(c => ({ key: c.category, label: `${c.icon} ${c.displayName}`, value: c.value, pct: c.pct }))}
                    total={totalExpenses}
                    size={140}
                  />
                )}
              </div>

              {/* Daily task activity */}
              <div className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>Taken activiteit</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>Afgelopen 14 dagen</p>
                </div>
                {loading ? <Skel h={180} /> : tasks.length === 0 ? (
                  <div className="flex items-center justify-center h-40">
                    <p className="text-sm" style={{ color: '#9CA3AF' }}>Nog geen taken aangemaakt</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dailyTaskData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Aangemaakt" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Voltooid" fill={GREEN} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Row 4: room progress ─────────────────────────────────────── */}
            {roomProgress.length > 0 && (
              <div className="rounded-2xl bg-white border p-5 sm:p-6" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#9CA3AF' }}>Voortgang per ruimte</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roomProgress.map((room) => (
                    <div key={room.id} className="rounded-xl p-4 border" style={{ borderColor: '#F3F4F6', backgroundColor: '#FAFAFA' }}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{room.name}</p>
                        <span
                          className="text-xs font-black px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: room.pct === 100 ? '#ECFDF5' : '#F0FDF4',
                            color: room.pct === 100 ? '#065F46' : GREEN,
                          }}
                        >{room.pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ backgroundColor: '#E5E7EB' }}>
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${room.pct}%`, background: room.pct === 100 ? `linear-gradient(90deg, ${GREEN}, ${GREEN_LIGHT})` : GREEN }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{room.done} van {room.total} {room.total === 1 ? 'taak' : 'taken'} klaar</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
