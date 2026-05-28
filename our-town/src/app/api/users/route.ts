import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

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
      emailVerified: { not: null },
      onboardingComplete: true,
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
    orderBy: [
      { plan: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return NextResponse.json(users)
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
  const verificationToken = crypto.randomBytes(32).toString('hex')

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      verificationToken,
    },
  })

  await sendVerificationEmail(email, verificationToken)

  const { passwordHash: _, verificationToken: _t, ...safe } = user
  return NextResponse.json(safe, { status: 201 })
}
