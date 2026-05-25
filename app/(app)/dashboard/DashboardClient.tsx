'use client';

import { useState, useEffect, useCallback } from 'react';
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

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-6 bg-white border animate-pulse" style={{ borderColor: '#E5E7EB' }}>
      <div className="h-4 rounded w-1/2 mb-3" style={{ backgroundColor: '#F3F4F6' }} />
      <div className="h-8 rounded w-2/3" style={{ backgroundColor: '#F3F4F6' }} />
    </div>
  );
}

export default function DashboardClient({
  greeting,
  profile,
  activeProject,
  todayTasks: initialTodayTasks,
  allTasks: initialAllTasks,
  expenses: initialExpenses,
  pendingQuotesCount: initialPendingQuotesCount,
  totalExpenses: initialTotalExpenses,
  budget,
  budgetPercentage: initialBudgetPercentage,
  activeDays,
}: Props) {
  // Live reactive state — all derived from server props, kept fresh by Realtime
  const [todayTasks, setTodayTasks] = useState<Task[]>(initialTodayTasks);
  const [allTasks, setAllTasks] = useState<Task[]>(initialAllTasks);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(initialPendingQuotesCount);
  const [upgradedBanner, setUpgradedBanner] = useState(false);

  // Derived values computed from live state
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budgetPercentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setUpgradedBanner(true);
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  // Refresh functions
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
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', activeProject.id)
      .order('created_at', { ascending: false });
    if (data) setExpenses(data);
  }, [activeProject]);

  const refreshQuotes = useCallback(async (supabase: ReturnType<typeof createClient>) => {
    if (!activeProject) return;
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', activeProject.id)
      .in('status', ['in_behandeling', 'pending']);
    setPendingQuotesCount(count ?? 0);
  }, [activeProject]);

  // Supabase Realtime subscriptions
  useEffect(() => {
    if (!activeProject) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard-${activeProject.id}`)
      // Tasks: any change → refresh tasks
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tasks',
        filter: `project_id=eq.${activeProject.id}`,
      }, () => refreshTasks(supabase))
      // Expenses: any change → refresh expenses (budget updates instantly)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'expenses',
        filter: `project_id=eq.${activeProject.id}`,
      }, () => refreshExpenses(supabase))
      // Quotes: any change → refresh pending count
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'quotes',
        filter: `project_id=eq.${activeProject.id}`,
      }, () => refreshQuotes(supabase))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeProject, refreshTasks, refreshExpenses, refreshQuotes]);

  const toggleTask = async (task: Task) => {
    const supabase = createClient();
    const newStatus = task.status === 'voltooid' || task.status === 'done' ? 'openstaand' : 'voltooid';
    const { data } = await supabase
      .from('tasks')
      .update({ status: newStatus, completed_at: newStatus === 'voltooid' ? new Date().toISOString() : null })
      .eq('id', task.id)
      .select()
      .single();

    if (data) {
      const update = (prev: Task[]) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus as Task['status'], completed_at: data.completed_at } : t);
      setTodayTasks(update);
      setAllTasks(update);
    }
  };

  const isTaskCompleted = (task: Task) => task.status === 'voltooid' || task.status === ('done' as string);

  const budgetColor = budgetPercentage >= 90 ? '#EF4444' : budgetPercentage >= 75 ? '#F59E0B' : '#288760';

  // Build recent activity feed from live state
  const recentActivity = [
    ...expenses.slice(0, 5).map((e) => ({
      id: e.id,
      type: 'expense' as const,
      description: `Kosten toegevoegd: ${e.description} (${formatCurrency(Number(e.amount))})`,
      time: e.created_at,
    })),
    ...allTasks
      .filter((t) => (t.status === 'voltooid' || t.status === 'done') && t.completed_at)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        type: 'task' as const,
        description: `Taak voltooid: ${t.title}`,
        time: t.completed_at!,
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Upgraded banner */}
      {upgradedBanner && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between"
          style={{ backgroundColor: '#B7E5BA', color: '#1A5140' }}
        >
          <span>Welkom bij Renofloww Pro! 🎉 Je hebt nu toegang tot alle functies.</span>
          <button onClick={() => setUpgradedBanner(false)} className="opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>
          {greeting}, {profile?.name?.split(' ')[0] || 'daar'}! 👋
        </h1>
        {activeProject && (
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Actief project: <Link href={`/projects/${activeProject.id}`} className="font-medium" style={{ color: '#288760' }}>{activeProject.name}</Link>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Budget gauge */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Budget gebruikt</p>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(${budgetColor} ${budgetPercentage * 3.6}deg, #E5E7EB 0deg)` }}
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold" style={{ color: budgetColor }}>
                {budgetPercentage}%
              </div>
            </div>
          </div>
          <p className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
            {budget > 0 ? formatCurrency(totalExpenses) : '—'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            {budget > 0 ? `van ${formatCurrency(budget)}` : 'Geen budget ingesteld'}
          </p>
        </div>

        {/* Tasks today */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>Taken vandaag</p>
          <p className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{todayTasks.length}</p>
          <Link href={activeProject ? `/projects/${activeProject.id}` : '/projects'} className="text-xs mt-1 block" style={{ color: '#288760' }}>
            Bekijk taken →
          </Link>
        </div>

        {/* Open quotes */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>Openstaande offertes</p>
          <p className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{pendingQuotesCount}</p>
          <Link href={activeProject ? `/projects/${activeProject.id}` : '/projects'} className="text-xs mt-1 block" style={{ color: '#288760' }}>
            Bekijk offertes →
          </Link>
        </div>

        {/* Active days */}
        <div className="rounded-2xl p-5 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-medium mb-3" style={{ color: '#6B7280' }}>Actieve dagen</p>
          <p className="text-3xl font-bold" style={{ color: '#1A1A1A' }}>{activeDays}</p>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
            {activeProject?.start_date ? 'Sinds start project' : 'Geen startdatum'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget card */}
        {activeProject && budget > 0 && (
          <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Budget overzicht</h2>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-xs" style={{ color: '#6B7280' }}>Totaal budget</p>
                <p className="text-base font-bold mt-1" style={{ color: '#1A1A1A' }}>{formatCurrency(budget)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#6B7280' }}>Uitgegeven</p>
                <p className="text-base font-bold mt-1" style={{ color: budgetColor }}>{formatCurrency(totalExpenses)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#6B7280' }}>Resterend</p>
                <p className="text-base font-bold mt-1" style={{ color: '#1A1A1A' }}>{formatCurrency(Math.max(budget - totalExpenses, 0))}</p>
              </div>
            </div>
            <div className="w-full rounded-full h-3 mb-2" style={{ backgroundColor: '#E5E7EB' }}>
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{ width: `${budgetPercentage}%`, backgroundColor: budgetColor }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: '#6B7280' }}>0%</span>
              <span className="text-xs font-medium" style={{ color: budgetColor }}>{budgetPercentage}%</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>100%</span>
            </div>
            {budgetPercentage >= 80 && (
              <div className="mt-4 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Let op: je hebt al {budgetPercentage}% van je budget gebruikt.
              </div>
            )}
          </div>
        )}

        {/* No active project */}
        {!activeProject && (
          <div className="rounded-2xl p-6 bg-white border text-center" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-base font-semibold mb-2" style={{ color: '#1A1A1A' }}>Geen actief project</h3>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Maak je eerste verbouwingsproject aan om te beginnen.</p>
            <Link href="/projects" className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#288760' }}>
              Project aanmaken
            </Link>
          </div>
        )}

        {/* Today's tasks */}
        <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: '#1A1A1A' }}>Taken vandaag</h2>
            {activeProject && (
              <Link href={`/projects/${activeProject.id}`} className="text-xs font-medium" style={{ color: '#288760' }}>
                Alle taken →
              </Link>
            )}
          </div>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Geen taken voor vandaag</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => toggleTask(task)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{ borderColor: isTaskCompleted(task) ? '#288760' : '#E5E7EB', backgroundColor: isTaskCompleted(task) ? '#288760' : 'transparent' }}
                  >
                    {isTaskCompleted(task) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className="text-sm flex-1" style={{ color: isTaskCompleted(task) ? '#9CA3AF' : '#1A1A1A', textDecoration: isTaskCompleted(task) ? 'line-through' : 'none' }}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity — updates in real-time as expenses/tasks change */}
        <div className="rounded-2xl p-6 bg-white border lg:col-span-2" style={{ borderColor: '#E5E7EB', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#1A1A1A' }}>Recente activiteit</h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: '#6B7280' }}>Nog geen activiteit. Voeg kosten of taken toe om te beginnen.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: activity.type === 'expense' ? '#FEF3C7' : '#B7E5BA' }}
                  >
                    {activity.type === 'expense' ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#F59E0B' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#288760' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#1A1A1A' }}>{activity.description}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{timeAgo(activity.time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
