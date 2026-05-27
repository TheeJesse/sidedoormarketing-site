export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// GET /api/users — browse directory with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('keyword') ?? ''
  const category = searchParams.get('category') ?? ''
  const city = searchParams.get('city') ?? ''

  const users = await prisma.user.findMany({
    where: {
      isApproved: true,
      isHidden: false,
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
      ...(keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: 'insensitive' } },
              { bio: { contains: keyword, mode: 'insensitive' } },
              { offers: { some: { title: { contains: keyword, mode: 'insensitive' } } } },
              { needs: { some: { title: { contains: keyword, mode: 'insensitive' } } } },
            ],
          }
        : {}),
      ...(category
        ? {
            OR: [
              { offers: { some: { category: { name: { contains: category, mode: 'insensitive' } } } } },
              { needs: { some: { category: { name: { contains: category, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
    },
    include: {
      offers: { include: { category: true } },
      needs: { include: { category: true } },
      reviews: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    users.map(({ passwordHash: _, ...u }) => u),
    { headers: { 'Cache-Control': 'no-store' } }
  )
}

// POST /api/users — sign up
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, password, city, state, zip, bio, radius, contactMethod, contactValue } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      city,
      state,
      zip,
      bio,
      radius: radius ? Number(radius) : 25,
      contactMethod,
      contactValue,
    },
  })

  // Return without passwordHash
  const { passwordHash: _, ...safe } = user
  return NextResponse.json(safe, { status: 201 })
}
