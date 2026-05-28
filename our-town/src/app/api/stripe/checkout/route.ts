import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe, getPriceId } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, billing } = await req.json()

  if (!plan || !billing) {
    return NextResponse.json({ error: 'plan and billing are required' }, { status: 400 })
  }

  const priceId = getPriceId(plan, billing)
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const origin = req.headers.get('origin') || 'http://localhost:3000'

  const checkoutSession = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/pricing`,
    metadata: { userId: user.id, plan },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
