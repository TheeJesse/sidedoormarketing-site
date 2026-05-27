import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) return {}
  return {
    title: `${user.name} — Our Town`,
    description: user.bio || `${user.name} is trading skills on This Is Our Town.`,
  }
}

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      offers: { include: { category: true }, orderBy: { createdAt: 'asc' } },
      needs: { include: { category: true }, orderBy: { createdAt: 'asc' } },
      reviews: true,
    },
  })
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id)

  if (!user || user.isHidden) notFound()

  const location = [user.city, user.state].filter(Boolean).join(', ')

  const TRUST_BADGES = [
    { icon: '✅', label: 'Verified Local', color: 'green' as const },
    { icon: '⚡', label: 'Quick Responder', color: 'amber' as const },
    { icon: '🤝', label: 'Trusted Trader', color: 'blue' as const },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/browse" className="inline-flex items-center gap-1.5 text-sm text-earth-500 hover:text-brand-600 mb-6 transition-colors">
        ← Back to browse
      </Link>

      {/* Profile header card */}
      <div className="bg-white rounded-2xl border border-bark-200 shadow-sm overflow-hidden mb-6">
        {/* Green header band */}
        <div className="h-20 bg-gradient-to-r from-brand-500 to-brand-400" />

        <div className="px-6 pb-6">
          {/* Avatar floats above band */}
          <div className="-mt-10 mb-4">
            <Avatar name={user.name} photoUrl={user.profilePhoto} size="xl" className="border-4 border-white shadow-sm" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-earth-800">{user.name}</h1>
              {location && (
                <p className="text-earth-400 text-sm flex items-center gap-1 mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </p>
              )}
              <p className="text-xs text-earth-400 mt-1">📍 Serves within {user.radius} miles</p>
            </div>

            {/* Contact */}
            {user.contactValue && (
              <div className="flex-shrink-0">
                <a
                  href={user.contactMethod === 'phone' ? `tel:${user.contactValue}` : `mailto:${user.contactValue}`}
                  className="inline-block"
                >
                  <Button size="md">
                    {user.contactMethod === 'phone' ? '📞' : '✉️'} Contact {user.name.split(' ')[0]}
                  </Button>
                </a>
                <p className="text-xs text-earth-400 mt-1.5 text-center">{user.contactValue}</p>
              </div>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-5 text-earth-600 leading-relaxed">{user.bio}</p>
          )}

          {/* Trust badges placeholder */}
          <div className="flex flex-wrap gap-2 mt-5">
            {TRUST_BADGES.slice(0, 1).map((b, i) => (
              <Badge key={i} variant={b.color} className="opacity-40 cursor-default">
                {b.icon} {b.label}
              </Badge>
            ))}
            <span className="text-xs text-earth-400 self-center">(Trust badges coming soon)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* What I Offer */}
        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-6">
          <h2 className="font-semibold text-brand-600 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🌱</span> What I Offer
          </h2>
          {user.offers.length === 0 ? (
            <p className="text-sm text-earth-400">Nothing listed yet.</p>
          ) : (
            <ul className="space-y-2">
              {user.offers.map(o => (
                <li key={o.id} className="flex items-start gap-2 text-sm text-earth-700">
                  <span className="text-brand-400 mt-0.5 flex-shrink-0">✦</span>
                  <div>
                    <span className="font-medium">{o.title}</span>
                    {o.category && (
                      <span className="ml-2 text-xs text-earth-400">{o.category.icon} {o.category.name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Looking For */}
        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-6">
          <h2 className="font-semibold text-amber-600 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🔍</span> Looking For
          </h2>
          {user.needs.length === 0 ? (
            <p className="text-sm text-earth-400">Nothing listed yet.</p>
          ) : (
            <ul className="space-y-2">
              {user.needs.map(n => (
                <li key={n.id} className="flex items-start gap-2 text-sm text-earth-700">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">✦</span>
                  <div>
                    <span className="font-medium">{n.title}</span>
                    {n.category && (
                      <span className="ml-2 text-xs text-earth-400">{n.category.icon} {n.category.name}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* CTA — join if not logged in */}
      <div className="mt-8 bg-brand-50 border border-brand-100 rounded-2xl p-6 text-center">
        <p className="text-earth-600 text-sm mb-3">
          Interested in trading with {user.name.split(' ')[0]}? Create your free profile to connect.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/auth/signup">
            <Button size="sm">🌱 Join the Tree</Button>
          </Link>
          <Link href="/browse">
            <Button variant="secondary" size="sm">Browse more traders</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
