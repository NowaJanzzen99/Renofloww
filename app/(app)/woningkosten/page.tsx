import { createClient } from '@/lib/supabase/server';
import WoningkostenClient from './WoningkostenClient';

export default async function WoningkostenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch house profile
  const { data: house } = await supabase
    .from('houses')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch all user projects (for expense query + dropdown)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const projectList = projects || [];
  const projectIds  = projectList.map((p: { id: string }) => p.id);

  // Fetch all expenses for user's projects
  let projectExpenses: {
    id: string; date: string; amount: number;
    description: string; category: string;
    project_name: string; project_id: string;
  }[] = [];

  if (projectIds.length > 0) {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, date, amount, description, category, project_id')
      .in('project_id', projectIds)
      .order('date', { ascending: false });

    if (expenses) {
      projectExpenses = expenses.map((e: {
        id: string; date: string; amount: number;
        description: string; category: string; project_id: string;
      }) => ({
        ...e,
        project_name: projectList.find((p: { id: string; name: string }) => p.id === e.project_id)?.name || 'Project',
      }));
    }
  }

  // Fetch onderhoud_kosten (only if house exists)
  const { data: onderhoudKosten } = house
    ? await supabase
        .from('onderhoud_kosten')
        .select('*')
        .eq('house_id', house.id)
        .order('date', { ascending: false })
    : { data: [] };

  return (
    <WoningkostenClient
      house={house || null}
      projectExpenses={projectExpenses}
      onderhoudKosten={onderhoudKosten || []}
      projects={projectList}
    />
  );
}
