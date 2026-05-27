import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findTopMatches, MatchableUser } from '@/lib/matching'

// GET /api/matches — returns top matches for the current user
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allUsers = await prisma.user.findMany({
    where: { isApproved: true, isHidden: false },
    include: {
      offers: { select: { title: true, categoryId: true } },
      needs: { select: { title: true, categoryId: true } },
    },
  })

  const subject = allUsers.find(u => u.id === session.user.id)
  if (!subject) return NextResponse.json([])

  const candidates: MatchableUser[] = allUsers.map(u => ({
    id: u.id,
    name: u.name,
    city: u.city,
    state: u.state,
    offers: u.offers,
    needs: u.needs,
  }))

  const subjectMatchable: MatchableUser = {
    id: subject.id,
    name: subject.name,
    city: subject.city,
    state: subject.state,
    offers: subject.offers,
    needs: subject.needs,
  }

  const matches = findTopMatches(subjectMatchable, candidates, 10)
  return NextResponse.json(matches)
}
