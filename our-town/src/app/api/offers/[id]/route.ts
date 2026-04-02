import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/offers/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const offer = await prisma.offer.findUnique({ where: { id: params.id } })
  if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (offer.userId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.offer.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
