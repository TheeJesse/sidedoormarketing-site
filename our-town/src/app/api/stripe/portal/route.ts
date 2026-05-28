import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const origin = req.headers.get('origin') || 'http://localhost:3000'

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/dashboard`,
  })

  return NextResponse.json({ url: portalSession.url })
}
