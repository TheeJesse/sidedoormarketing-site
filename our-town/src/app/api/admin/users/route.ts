import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin only: GET all users including hidden/unapproved
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: {
      offers: { include: { category: true } },
      needs: { include: { category: true } },
      _count: { select: { offers: true, needs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    users.map(({ passwordHash: _, ...u }) => u)
  )
}
