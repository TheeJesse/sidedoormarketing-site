import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=missing-token', req.url))
  }

  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  })

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid-token', req.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
    },
  })

  return NextResponse.redirect(new URL('/auth/login?verified=true', req.url))
}
