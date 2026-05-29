import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/offers — add an offer for the current user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, categoryId, description } = await req.json()
  if (!title || typeof title !== 'string' || title.trim().length < 1 || title.length > 200) {
    return NextResponse.json({ error: 'Title is required and must be under 200 characters' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { offers: { select: { id: true } } },
  })

  if (user && user.plan === 'free' && user.offers.length >= 5) {
    return NextResponse.json(
      { error: 'Free plan is limited to 5 offers. Upgrade to add more.' },
      { status: 403 }
    )
  }

  const offer = await prisma.offer.create({
    data: { userId: session.user.id, title, categoryId: categoryId || null, description: description || null },
    include: { category: true },
  })

  return NextResponse.json(offer, { status: 201 })
}
