import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface UserCardProps {
  user: {
    id: string
    name: string
    city: string | null
    state: string | null
    bio: string | null
    radius: number
    profilePhoto: string | null
    plan?: string
    offers: { id: string; title: string; category: { name: string; icon: string | null } | null }[]
    needs: { id: string; title: string; category: { name: string; icon: string | null } | null }[]
  }
}

export function UserCard({ user }: UserCardProps) {
  const location = [user.city, user.state].filter(Boolean).join(', ')
  const topOffers = user.offers.slice(0, 3)
  const topNeeds = user.needs.slice(0, 3)

  return (
    <Link href={`/profile/${user.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-bark-200 p-5 hover:shadow-md hover:border-brand-200 transition-all duration-200 h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar name={user.name} photoUrl={user.profilePhoto} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-earth-800 group-hover:text-brand-600 transition-colors truncate">
                {user.name}
              </h3>
              {user.plan === 'neighbor' && (
                <Badge variant="green">🌿 Neighbor</Badge>
              )}
              {user.plan === 'pro' && (
                <Badge variant="green">⭐ Pro</Badge>
              )}
            </div>
            {location && (
              <p className="text-xs text-earth-400 flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location} · {user.radius}mi radius
              </p>
            )}
          </div>
        </div>

        {/* Bio preview */}
        {user.bio && (
          <p className="text-sm text-earth-500 line-clamp-2 leading-relaxed">{user.bio}</p>
        )}

        {/* Offers */}
        {topOffers.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mb-1.5">Offers</p>
            <div className="flex flex-wrap gap-1.5">
              {topOffers.map(o => (
                <Badge key={o.id} variant="green">
                  {o.category?.icon} {o.title}
                </Badge>
              ))}
              {user.offers.length > 3 && (
                <Badge variant="earth">+{user.offers.length - 3} more</Badge>
              )}
            </div>
          </div>
        )}

        {/* Needs */}
        {topNeeds.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Looking For</p>
            <div className="flex flex-wrap gap-1.5">
              {topNeeds.map(n => (
                <Badge key={n.id} variant="amber">
                  {n.category?.icon} {n.title}
                </Badge>
              ))}
              {user.needs.length > 3 && (
                <Badge variant="earth">+{user.needs.length - 3} more</Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
