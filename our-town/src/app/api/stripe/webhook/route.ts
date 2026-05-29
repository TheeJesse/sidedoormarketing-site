import { NextRequest, NextResponse } from 'next/server'
import { getStripe, planFromPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break

      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId ? planFromPriceId(priceId) : null

        if (!plan) {
          console.error(`Unknown Stripe price ID: ${priceId}`)
          return NextResponse.json({ error: 'Unknown price ID' }, { status: 400 })
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
          },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan: 'free', stripeSubscriptionId: null },
      })
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id

      if (subscription.status === 'active') {
        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId ? planFromPriceId(priceId) : null

        if (!plan) {
          console.error(`Unknown Stripe price ID on subscription update: ${priceId}`)
          break
        }

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan, stripeSubscriptionId: subscription.id },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
