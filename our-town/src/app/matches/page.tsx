'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MatchCard } from '@/components/matches/MatchCard'
import { Button } from '@/components/ui/Button'
import type { MatchResult } from '@/lib/matching'

export default function MatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [capped, setCapped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login?callbackUrl=/matches')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/matches')
        .then(r => r.json())
        .then((data: { matches: MatchResult[]; total: number; capped: boolean }) => {
          setMatches(data.matches)
          setTotalMatches(data.total)
          setCapped(data.capped)
          setLoading(false)
        })
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-earth-400">Finding your matches…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-earth-800 mb-2">Your Barter Matches</h1>
        <p className="text-earth-500">
          People whose offers match your needs — and who need what you offer.
        </p>
      </div>

      {/* How matching works */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-8 text-sm text-earth-600 flex gap-3">
        <span className="text-xl">💡</span>
        <div>
          <strong className="text-earth-700">How matches work:</strong> We compare your offers against
          others&apos; needs, and your needs against others&apos; offers.
          Matches are scored by category overlap and keyword similarity.
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🌿</div>
          <h3 className="text-xl font-semibold text-earth-700 mb-2">No matches yet</h3>
          <p className="text-earth-400 mb-6 max-w-sm mx-auto">
            Add more offers and needs to your profile to improve your match results.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button>Update my profile</Button>
            </Link>
            <Link href="/browse">
              <Button variant="secondary">Browse manually</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match) => (
            <MatchCard key={match.user.id} match={match} />
          ))}

          {capped && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
              <div className="text-3xl mb-2">🌳</div>
              <h3 className="font-bold text-earth-800 mb-1">
                {totalMatches - matches.length} more match{totalMatches - matches.length === 1 ? '' : 'es'} available
              </h3>
              <p className="text-sm text-earth-500 mb-4">
                Free accounts see up to 3 matches. Upgrade to see all of them.
              </p>
              <Link href="/pricing">
                <Button size="sm">View plans</Button>
              </Link>
            </div>
          )}

          <div className="text-center pt-4">
            <Link href="/browse">
              <Button variant="secondary">Browse all traders →</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
