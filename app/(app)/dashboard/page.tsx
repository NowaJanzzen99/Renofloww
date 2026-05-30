import { createClient } from '@/lib/supabase/server';
import { getGreeting, formatCurrency, formatDate } from '@/lib/utils';
import DashboardClient from './DashboardClient';
import type { Profile, Project, Task, Expense, Quote, Room } from '@/types';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const greeting = getGreeting();

  const [profileRes, projectsRes, houseRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('houses').select('*').eq('user_id', user.id).single(),
  ]);

  const profile: Profile | null = profileRes.data;
  const projects: Project[] = projectsRes.data || [];
  const house = houseRes.data || null;

  // Get first active project data
  const activeProject = projects.find((p) => p.status === 'lopend') || projects[0];

  let tasks: Task[] = [];
  let expenses: Expense[] = [];
  let quotes: Quote[] = [];
  let rooms: Room[] = [];

  if (activeProject) {
    const [tasksRes, expensesRes, quotesRes, roomsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('project_id', activeProject.id).order('date', { ascending: false }),
      supabase.from('quotes').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: false }),
      supabase.from('rooms').select('*').eq('project_id', activeProject.id).order('created_at', { ascending: true }),
    ]);

    tasks = tasksRes.data || [];
    expenses = expensesRes.data || [];
    quotes = quotesRes.data || [];
    rooms = roomsRes.data || [];
  }

  // Local-date helper (server runs UTC; use wall-clock fields to avoid off-by-one)
  const localToday = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const todayTasks = tasks.filter((t) => t.due_date === localToday);
  const pendingQuotes = quotes.filter((q) => q.status === 'in_behandeling' || q.status === 'pending');
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = activeProject?.budget ? Number(activeProject.budget) : 0;
  const budgetPercentage = budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;

  // Total unique dates on which the user did something (expenses or completed tasks).
  // This is a count of real activity days — never negative, independent of start_date.
  const activeDatesSet = new Set<string>();
  expenses.forEach((e) => {
    const d = e.date || (e.created_at ? e.created_at.split('T')[0] : null);
    if (d) activeDatesSet.add(d);
  });
  tasks
    .filter((t) => t.completed_at)
    .forEach((t) => activeDatesSet.add(t.completed_at!.split('T')[0]));
  const activeDays = activeDatesSet.size;

  return (
    <DashboardClient
      greeting={greeting}
      profile={profile}
      activeProject={activeProject || null}
      todayTasks={todayTasks}
      allTasks={tasks}
      expenses={expenses}
      rooms={rooms}
      pendingQuotesCount={pendingQuotes.length}
      totalExpenses={totalExpenses}
      budget={budget}
      budgetPercentage={budgetPercentage}
      activeDays={activeDays}
      house={house}
    />
  );
}
