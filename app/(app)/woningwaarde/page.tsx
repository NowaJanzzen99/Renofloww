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

  const trialActive = !!(profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date());
  const isPro = !!(profile?.is_pro || profile?.plan === 'pro' || trialActive);

  // Fetch house
  const { data: house } = await supabase
    .from('houses')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch total invested (project expenses + onderhoud_kosten)
  let totalInvested = 0;

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id);

  const projectIds = (projects || []).map((p: { id: string }) => p.id);

  if (projectIds.length > 0) {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .in('project_id', projectIds);
    totalInvested += (expenses || []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
  }

  if (house) {
    const { data: onderhoud } = await supabase
      .from('onderhoud_kosten')
      .select('amount')
      .eq('house_id', house.id);
    totalInvested += (onderhoud || []).reduce((s: number, k: { amount: number }) => s + Number(k.amount), 0);
  }

  return (
    <WoningwaardeClient
      house={house || null}
      totalInvested={totalInvested}
      isPro={isPro}
    />
  );
}
