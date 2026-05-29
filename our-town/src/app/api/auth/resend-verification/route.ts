import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  if (!rateLimit(`resend:${ip}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: token, verificationTokenExpiresAt: tokenExpiry },
  })

  await sendVerificationEmail(user.email, token)

  return NextResponse.json({ ok: true })
}
