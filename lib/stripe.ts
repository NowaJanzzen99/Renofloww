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
