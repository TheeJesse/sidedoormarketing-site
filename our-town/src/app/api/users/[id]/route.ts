import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/users/[id] — public profile
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      offers: { include: { category: true } },
      needs: { include: { category: true } },
      reviews: true,
    },
  })

  if (!user || user.isHidden) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { passwordHash: _, ...safe } = user
  return NextResponse.json(safe)
}

// PATCH /api/users/[id] — update own profile
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.id !== params.id && !session.user.isAdmin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, city, state, zip, bio, radius, contactMethod, contactValue, isHidden, isApproved, onboardingComplete } = body

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1 || name.length > 100)) {
    return NextResponse.json({ error: 'Name must be 1–100 characters' }, { status: 400 })
  }
  if (radius !== undefined) {
    const r = Number(radius)
    if (isNaN(r) || r < 1 || r > 500) {
      return NextResponse.json({ error: 'Radius must be 1–500 miles' }, { status: 400 })
    }
  }
  if (bio !== undefined && typeof bio === 'string' && bio.length > 2000) {
    return NextResponse.json({ error: 'Bio must be under 2000 characters' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zip !== undefined && { zip }),
      ...(bio !== undefined && { bio }),
      ...(radius !== undefined && { radius: Number(radius) }),
      ...(contactMethod !== undefined && { contactMethod }),
      ...(contactValue !== undefined && { contactValue }),
      ...(onboardingComplete !== undefined && { onboardingComplete }),
      // Admin-only fields
      ...(session.user.isAdmin && isHidden !== undefined && { isHidden }),
      ...(session.user.isAdmin && isApproved !== undefined && { isApproved }),
    },
  })

  const { passwordHash: _, ...safe } = updated
  return NextResponse.json(safe)
}

// DELETE /api/users/[id] — admin or self
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.id !== params.id && !session.user.isAdmin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
