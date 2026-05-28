import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-05-27.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

export const PRICE_IDS: Record<string, string> = {
  neighbor_monthly: 'price_1TbuXjLp18ha5D1nmRfajWD8',
  neighbor_annual: 'price_1TbuaqLp18ha5D1nRC1NRo6F',
  pro_monthly: 'price_1TbueuLp18ha5D1nnjUkS4RX',
  pro_annual: 'price_1TbuaMLp18ha5D1n7SNV4kzY',
}

export function getPriceId(plan: string, billing: string): string | null {
  const key = `${plan}_${billing}`
  return PRICE_IDS[key] ?? null
}

export function planFromPriceId(priceId: string): string {
  for (const [key, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return key.split('_')[0]
  }
  return 'free'
}
