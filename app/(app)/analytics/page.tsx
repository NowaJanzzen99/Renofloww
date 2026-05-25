'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { Project, Task, Expense, Room } from '@/types';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  materiaal: '#288760',
  arbeid: '#5CA87C',
  vergunning: '#B7E5BA',
  transport: '#1A5140',
  overig: '#9CA3AF',
};

const CATEGORY_LABELS: Record<string, string> = {
  materiaal: '🧱 Materiaal',
  arbeid: '👷 Arbeid',
  vergunning: '📋 Vergunning',
  transport: '🚚 Transport',
  overig: '📦 Overig',
};

function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="animate-pulse rounded-xl" style={{ height, backgroundColor: '#F3F4F6' }} />
  );
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setProjects(data || []);
        if (data && data.length > 0) setSelectedProjectId(data[0].id);
      } catch {
        setError('Kon projecten niet laden.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const load = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const [tasksRes, expensesRes, roomsRes] = await Promise.all([
          supabase.from('tasks').select('*').eq('project_id', selectedProjectId),
          supabase.from('expenses').select('*').eq('project_id', selectedProjectId).order('date'),
          supabase.from('rooms').select('*').eq('project_id', selectedProjectId),
        ]);
        setTasks(tasksRes.data || []);
        setExpenses(expensesRes.data || []);
        setRooms(roomsRes.data || []);
      } catch {
        setError('Kon analysegegevens niet laden.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const budget = Number(selectedProject?.budget) || 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const completedTasks = tasks.filter((t) => t.status === 'voltooid' || t.status === 'done').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Overall progress (average of budget + tasks)
  const budgetProgress = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const overallProgress = Math.round((taskProgress + (100 - budgetProgress)) / 2);

  // Radial bar data
  const radialData = [{ name: 'Voortgang', value: taskProgress, fill: '#288760' }];

  // Cumulative budget line chart
  const budgetLineData = (() => {
    let cumulative = 0;
    const grouped: Record<string, number> = {};
    expenses.forEach((e) => {
      const date = e.date || e.created_at.split('T')[0];
      grouped[date] = (grouped[date] || 0) + Number(e.amount);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => {
      cumulative += amount;
      return { date: date.slice(5), cumulative: Math.round(cumulative), budget };
    });
  })();

  // Category pie chart
  const categoryData = Object.entries(
    expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, amount]) => ({ name: CATEGORY_LABELS[category] || category, value: Math.round(amount), category }));

  // Weekly tasks bar chart
  const weeklyTaskData = (() => {
    const weeks: Record<string, { completed: number; total: number }> = {};
    tasks.forEach((t) => {
      const date = t.due_date || t.created_at.split('T')[0];
      const d = new Date(date);
      const weekNum = Math.ceil(d.getDate() / 7);
      const key = `Week ${weekNum}`;
      if (!weeks[key]) weeks[key] = { completed: 0, total: 0 };
      weeks[key].total++;
      if (t.status === 'voltooid' || t.status === 'done') weeks[key].completed++;
    });
    return Object.entries(weeks).map(([week, data]) => ({ week, ...data }));
  })();

  // Room progress
  const roomProgress = rooms.map((room) => {
    const roomTasks = tasks.filter((t) => t.room_id === room.id);
    const done = roomTasks.filter((t) => t.status === 'voltooid' || t.status === 'done').length;
    return { ...room, total: roomTasks.length, done, progress: roomTasks.length > 0 ? Math.round((done / roomTasks.length) * 100) : 0 };
  });

  const isEmpty = tasks.length === 0 && expenses.length === 0;

  const customTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}>
        <p className="font-medium mb-1" style={{ color: '#1A1A1A' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: '#6B7280' }}>{p.name}: {typeof p.value === 'number' ? formatCurrency(p.value) : p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>Voortgang & Analyse</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B7280' }}>Inzicht in je verbouwingsproject</p>
        </div>
        {projects.length > 1 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FEF2F2', color: '#EF4444' }}>{error}</div>
      )}

      {!loading && isEmpty ? (
        <div className="text-center py-16 rounded-2xl bg-white border" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-4xl mb-4">📊</p>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Voeg kosten en taken toe om je analyse te zien</h3>
          <p className="text-sm" style={{ color: '#6B7280' }}>Begin met het registreren van kosten en taken in je project.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Taak voortgang', value: `${taskProgress}%`, sub: `${completedTasks}/${tasks.length} voltooid` },
              { label: 'Budget gebruikt', value: `${budgetProgress}%`, sub: budget > 0 ? `${formatCurrency(totalExpenses)} van ${formatCurrency(budget)}` : 'Geen budget' },
              { label: 'Totale kosten', value: formatCurrency(totalExpenses), sub: `${expenses.length} uitgaven` },
              { label: 'Ruimtes', value: rooms.length.toString(), sub: `${roomProgress.filter(r => r.progress === 100).length} voltooid` },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{loading ? '—' : stat.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{loading ? '' : stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Overall progress radial */}
            <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Taak voortgang</h3>
              {loading ? <SkeletonChart height={160} /> : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={160}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                      <RadialBar background={{ fill: '#E5E7EB' }} dataKey="value" cornerRadius={8} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <p className="text-3xl font-bold" style={{ color: '#288760' }}>{taskProgress}%</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Voltooid</p>
                  </div>
                </div>
              )}
            </div>

            {/* Cost breakdown pie */}
            <div className="rounded-2xl p-6 bg-white border lg:col-span-2" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Kostenverdeling</h3>
              {loading ? <SkeletonChart height={200} /> : categoryData.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#6B7280' }}>Nog geen kosten geregistreerd</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                      {categoryData.map((entry) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#9CA3AF'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: '11px', color: '#6B7280' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Budget line chart */}
          {budget > 0 && (
            <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Kosten over tijd</h3>
              {loading ? <SkeletonChart height={200} /> : budgetLineData.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#6B7280' }}>Nog geen kosten geregistreerd</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={budgetLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={customTooltip as (props: unknown) => React.JSX.Element | null} />
                    <ReferenceLine y={budget} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Budget', position: 'right', fontSize: 10, fill: '#EF4444' }} />
                    <Line type="monotone" dataKey="cumulative" stroke="#288760" strokeWidth={2} dot={{ fill: '#288760', r: 3 }} name="Totaal uitgegeven" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Tasks bar chart */}
          {weeklyTaskData.length > 0 && (
            <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Taken per week</h3>
              {loading ? <SkeletonChart height={180} /> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyTaskData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Totaal" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Voltooid" fill="#288760" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Per-room progress */}
          {roomProgress.length > 0 && (
            <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#1A1A1A' }}>Voortgang per ruimte</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roomProgress.map((room) => (
                  <div key={room.id} className="rounded-xl border p-3" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{room.name}</p>
                      <p className="text-sm font-semibold" style={{ color: '#288760' }}>{room.progress}%</p>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${room.progress}%`, backgroundColor: '#288760' }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{room.done}/{room.total} taken</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
