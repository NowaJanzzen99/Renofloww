import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is niet geconfigureerd.' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Resolve price ID from plan key (server-side only — never exposed to browser)
    const plan: string = body.plan || 'monthly';
    const priceId: string = plan === 'yearly'
      ? (process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_PRO_YEARLY || '')
      : (process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_PRO_MONTHLY || '');

    if (!priceId) {
      return NextResponse.json(
        { error: `Prijs ID voor plan "${plan}" is niet geconfigureerd.` },
        { status: 500 },
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // Verify the stored customer ID exists in the current Stripe mode.
    // A test-mode customer ID will not exist in live mode (and vice versa),
    // so fall back to creating a new customer when retrieval fails.
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.name || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Always derive baseUrl from the request itself — never rely on
    // NEXT_PUBLIC_APP_URL which may point to an unresolved custom domain.
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/settings#abonnement`,
      locale: 'nl',
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de betaalsessie.' },
      { status: 500 }
    );
  }
}
