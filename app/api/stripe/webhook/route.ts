import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Geen Stripe signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is niet geconfigureerd' }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Ongeldige signature' }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = event.data.object as any;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub = subscription as any;
          const userId = sub.metadata?.supabase_user_id || session.metadata?.supabase_user_id;

          if (userId) {
            await supabase
              .from('profiles')
              .update({
                stripe_subscription_id: subscription.id,
                stripe_customer_id: session.customer as string,
                plan: 'pro',
                is_pro: true,
                trial_ends_at: null,
              })
              .eq('id', userId);

            await supabase.from('notifications').insert({
              user_id: userId,
              title: 'Welkom bij Renofloww Pro!',
              message: 'Je abonnement is geactiveerd. Geniet van alle premium functies.',
              type: 'systeem',
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: subscription.id,
              plan: isActive ? 'pro' : 'free',
              is_pro: isActive,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              stripe_subscription_id: null,
              plan: 'free',
              is_pro: false,
            })
            .eq('id', userId);

          await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Abonnement beëindigd',
            message: 'Je Pro abonnement is beëindigd. Je hebt nog toegang tot je projecten.',
            type: 'systeem',
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription || invoice.lines?.data?.[0]?.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userId = (subscription as any).metadata?.supabase_user_id;

          if (userId) {
            await supabase
              .from('profiles')
              .update({ plan: 'pro', is_pro: true })
              .eq('id', userId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription || invoice.lines?.data?.[0]?.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userId = (subscription as any).metadata?.supabase_user_id;

          if (userId) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title: 'Betaling mislukt',
              message: 'De betaling voor je abonnement is mislukt. Update je betaalgegevens om toegang te behouden.',
              type: 'systeem',
            });
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook verwerking mislukt' },
      { status: 500 }
    );
  }
}
