import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import StreakClient from './StreakClient';

export default async function StreakPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  const [profileRes, projectsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  const profile = profileRes.data;
  const projects = projectsRes.data || [];
  const activeProject = projects.find((p) => p.status === 'lopend') || projects[0] || null;

  let tasksData: any[] = [];
  let expensesData: any[] = [];

  if (activeProject) {
    const [tasksRes, expensesRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', activeProject.id),
      supabase.from('expenses').select('*').eq('project_id', activeProject.id),
    ]);
    tasksData = tasksRes.data || [];
    expensesData = expensesRes.data || [];
  }

  return (
    <StreakClient
      profile={profile}
      activeProject={activeProject}
      tasks={tasksData}
      expenses={expensesData}
    />
  );
}
