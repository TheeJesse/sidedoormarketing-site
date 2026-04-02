import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import type { MatchResult } from '@/lib/matching'

interface MatchCardProps {
  match: MatchResult
}

export function MatchCard({ match }: MatchCardProps) {
  const { user, score, reasons } = match
  const location = [user.city, user.state].filter(Boolean).join(', ')

  // Color-code score tiers
  const scoreTier =
    score >= 30 ? 'Strong match' :
    score >= 15 ? 'Good match' :
    'Possible match'

  const tierColor =
    score >= 30 ? 'text-brand-600 bg-brand-50 border-brand-200' :
    score >= 15 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-earth-600 bg-earth-50 border-earth-200'

  return (
    <div className={`rounded-2xl border p-5 ${tierColor} transition-all`}>
      <div className="flex items-start gap-4">
        <Avatar name={user.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${user.id}`}
              className="font-semibold hover:underline text-earth-800"
            >
              {user.name}
            </Link>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 border border-current">
              {scoreTier}
            </span>
          </div>
          {location && (
            <p className="text-xs text-earth-400 mt-0.5">{location}</p>
          )}

          {/* Top 2 reasons */}
          <ul className="mt-3 space-y-1.5">
            {reasons.slice(0, 2).map((r, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-brand-500 mt-0.5 flex-shrink-0">↔</span>
                {r}
              </li>
            ))}
            {reasons.length > 2 && (
              <li className="text-xs text-earth-400">+{reasons.length - 2} more overlaps</li>
            )}
          </ul>
        </div>

        {/* Score pill */}
        <div className="flex-shrink-0 text-center">
          <div className="text-lg font-bold text-earth-700">{score}</div>
          <div className="text-[10px] text-earth-400 uppercase tracking-wide">pts</div>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={`/profile/${user.id}`}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          View profile →
        </Link>
      </div>
    </div>
  )
}
