import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getSubscriptionSummary } from '@/lib/stripe';

export async function POST() {
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
    return NextResponse.json({ error: 'Geen actief abonnement gevonden.' }, { status: 400 });
  }

  try {
    await stripe.subscriptions.update(profile.stripe_subscription_id, { cancel_at_period_end: true });
    const summary = await getSubscriptionSummary(profile.stripe_subscription_id);
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('Kon abonnement niet opzeggen:', err);
    return NextResponse.json({ error: 'Opzeggen is mislukt. Probeer het opnieuw of neem contact op met support.' }, { status: 502 });
  }
}
