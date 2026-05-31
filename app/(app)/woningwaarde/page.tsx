import { createClient } from '@/lib/supabase/server';
import WoningwaardeClient from './WoningwaardeClient';

export default async function WoningwaardePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Check pro status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, plan, trial_ends_at')
    .eq('id', user.id)
    .single();

  // Only block when trial is explicitly set AND already in the past.
  // null = trial not started yet → still has access (layout.tsx will set it on next navigation).
  const trialExpired = !!(profile?.trial_ends_at && new Date(profile.trial_ends_at) <= new Date());
  const isPro = !!(profile?.is_pro || profile?.plan === 'pro' || !trialExpired);

  // Fetch all houses
  const { data: houses } = await supabase
    .from('houses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  const houseList = houses || [];

  // Fetch total invested (project expenses + onderhoud_kosten)
  let totalInvested = 0;

  const { data: projects } = await supabase
    .from('projects')
    .select('id, start_date')
    .eq('user_id', user.id);

  const projectIds = (projects || []).map((p: { id: string; start_date?: string | null }) => p.id);

  // Earliest project start date for the "since project" chart mode
  const projectStartDate =
    (projects || [])
      .map((p: { start_date?: string | null }) => p.start_date)
      .filter(Boolean)
      .sort()[0] ?? null;

  if (projectIds.length > 0) {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .in('project_id', projectIds);
    totalInvested += (expenses || []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
  }

  if (houseList.length > 0) {
    const houseIds = houseList.map((h: { id: string }) => h.id);
    const { data: onderhoud } = await supabase
      .from('onderhoud_kosten')
      .select('amount')
      .in('house_id', houseIds);
    totalInvested += (onderhoud || []).reduce((s: number, k: { amount: number }) => s + Number(k.amount), 0);
  }

  return (
    <WoningwaardeClient
      houses={houseList}
      totalInvested={totalInvested}
      isPro={isPro}
      projectStartDate={projectStartDate}
    />
  );
}
