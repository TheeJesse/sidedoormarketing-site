import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findTopMatches, MatchableUser } from '@/lib/matching'

export const dynamic = 'force-dynamic'

const FREE_MATCH_LIMIT = 3

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
  if (!subject) return NextResponse.json({ matches: [], total: 0, capped: false })

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

  const allMatches = findTopMatches(subjectMatchable, candidates, 20)
  const isFree = subject.plan === 'free'
  const capped = isFree && allMatches.length > FREE_MATCH_LIMIT
  const matches = isFree ? allMatches.slice(0, FREE_MATCH_LIMIT) : allMatches

  return NextResponse.json({ matches, total: allMatches.length, capped })
}
