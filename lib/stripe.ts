import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;

// Stripe client — will throw at runtime if key is missing, not at build time
export const stripe = new Stripe(stripeKey || 'sk_placeholder_for_build', {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
} as const;

export interface SubscriptionSummary {
  status: Stripe.Subscription.Status;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  interval: 'month' | 'year' | null;
  /** Nog een lopende betaalverplichting die niet is opgezegd. */
  stillCommitted: boolean;
}

const TERMINAL_STATUSES: Stripe.Subscription.Status[] = ['canceled', 'incomplete_expired'];

export async function getSubscriptionSummary(subscriptionId: string): Promise<SubscriptionSummary> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
  const item = sub.items.data[0];

  return {
    status: sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    interval: (item?.price?.recurring?.interval as 'month' | 'year' | undefined) ?? null,
    stillCommitted: !TERMINAL_STATUSES.includes(sub.status) && !sub.cancel_at_period_end,
  };
}
