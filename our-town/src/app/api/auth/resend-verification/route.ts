import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken: token },
  })

  await sendVerificationEmail(user.email, token)

  return NextResponse.json({ ok: true })
}
