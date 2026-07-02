import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, avatar_url')
    .eq('id', user.id)
    .single();

  // Actief abonnement moet eerst geannuleerd worden — anders blijft Stripe
  // een gebruiker belasten die geen account (en dus geen toegang) meer heeft.
  if (profile?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch (err) {
      const alreadyGone =
        typeof err === 'object' && err !== null && 'code' in err && err.code === 'resource_missing';
      if (!alreadyGone) {
        console.error('Kon Stripe-abonnement niet opzeggen bij account verwijderen:', err);
        return NextResponse.json(
          { error: 'Kon je abonnement niet opzeggen. Probeer het opnieuw of neem contact op met support.' },
          { status: 502 }
        );
      }
    }
  }

  const admin = createAdminClient();

  // Best-effort: avatar uit storage verwijderen (blokkeert de verwijdering niet).
  if (profile?.avatar_url) {
    try {
      const { data: files } = await admin.storage.from('avatars').list('avatars', { search: user.id });
      const toRemove = (files ?? []).map((f) => `avatars/${f.name}`);
      if (toRemove.length > 0) await admin.storage.from('avatars').remove(toRemove);
    } catch (err) {
      console.error('Kon avatar niet verwijderen:', err);
    }
  }

  // Verwijdert de auth-user; profiel, huizen, projecten en alle onderliggende
  // data (taken, offertes, kosten, documenten, foto's, etc.) cascaden mee via de DB.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('Kon account niet verwijderen:', deleteError);
    return NextResponse.json({ error: 'Verwijderen van account is mislukt. Probeer het opnieuw.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
