export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/needs — add a need for the current user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, categoryId, description } = await req.json()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const need = await prisma.need.create({
    data: { userId: session.user.id, title, categoryId: categoryId || null, description: description || null },
    include: { category: true },
  })

  return NextResponse.json(need, { status: 201 })
}
