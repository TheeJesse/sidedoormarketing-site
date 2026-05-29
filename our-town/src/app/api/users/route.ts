import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME = 100
const MAX_TITLE = 200
const MIN_PASSWORD = 6
const MAX_PASSWORD = 128

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
  const ip = getClientIp(req.headers)
  if (!rateLimit(`signup:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body = await req.json()
  const { name, email, password, city, state, zip, bio, radius, contactMethod, contactValue } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
  }

  if (typeof name !== 'string' || name.trim().length < 1 || name.length > MAX_NAME) {
    return NextResponse.json({ error: `Name must be 1–${MAX_NAME} characters` }, { status: 400 })
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    return NextResponse.json({ error: `Password must be ${MIN_PASSWORD}–${MAX_PASSWORD} characters` }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const verificationToken = crypto.randomBytes(32).toString('hex')

  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      verificationToken,
      verificationTokenExpiresAt: tokenExpiry,
    },
  })

  await sendVerificationEmail(email, verificationToken)

  const { passwordHash: _, verificationToken: _t, ...safe } = user
  return NextResponse.json(safe, { status: 201 })
}
