import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionSummary } from '@/lib/stripe';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ hasSubscription: false });
  }

  try {
    const summary = await getSubscriptionSummary(profile.stripe_subscription_id);
    return NextResponse.json({ hasSubscription: true, ...summary });
  } catch (err) {
    console.error('Kon abonnementsstatus niet ophalen:', err);
    return NextResponse.json({ hasSubscription: false });
  }
}
