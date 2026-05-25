import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProjectDetailClient from './ProjectDetailClient';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) return notFound();

  const [roomsRes, tasksRes, contractorsRes, quotesRes, expensesRes, extraWorkRes] = await Promise.all([
    supabase.from('rooms').select('*').eq('project_id', id),
    supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('contractors').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('quotes').select('*, contractors(name)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
    supabase.from('extra_work').select('*, contractors(name)').eq('project_id', id).order('created_at', { ascending: false }),
  ]);

  return (
    <ProjectDetailClient
      initialProject={project}
      initialRooms={roomsRes.data || []}
      initialTasks={tasksRes.data || []}
      initialContractors={contractorsRes.data || []}
      initialQuotes={quotesRes.data || []}
      initialExpenses={expensesRes.data || []}
      initialExtraWork={extraWorkRes.data || []}
    />
  );
}
