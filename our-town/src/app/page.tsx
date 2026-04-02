import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { prisma } from '@/lib/prisma'
import { UserCard } from '@/components/browse/UserCard'

async function getRecentUsers() {
  return prisma.user.findMany({
    where: { isApproved: true, isHidden: false },
    include: {
      offers: { include: { category: true } },
      needs: { include: { category: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
}

const HOW_IT_WORKS = [
  {
    icon: '🌱',
    title: 'Create your profile',
    desc: 'Share who you are, where you are, what you offer, and what you need.',
  },
  {
    icon: '🔍',
    title: 'Browse local people',
    desc: 'Find neighbors with skills and goods you need — and who need what you have.',
  },
  {
    icon: '🤝',
    title: 'Make a trade',
    desc: 'Reach out, agree on a fair exchange, and build a real local relationship.',
  },
]

const EXAMPLES = [
  { a: 'Jesse offers fence repair', b: 'needs an auto mechanic', emoji: '🔧' },
  { a: 'Maria offers massage', b: 'needs handyman help', emoji: '💆' },
  { a: 'Lisa offers homegrown eggs', b: 'needs website help', emoji: '🥚' },
  { a: 'Bob offers AI consulting', b: 'needs electrical work', emoji: '🤖' },
]

export default async function LandingPage() {
  const recentUsers = await getRecentUsers()

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-bark-50 to-earth-50 border-b border-bark-200">
        {/* Decorative tree rings background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden>
          <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            {[60, 120, 200, 300, 420, 560].map((r, i) => (
              <circle key={i} cx="750" cy="0" r={r} fill="none" stroke="#3a7d2c" strokeWidth="1" />
            ))}
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>🌳</span> Local skill &amp; service exchange
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-earth-800 leading-tight tracking-tight mb-6">
            Trade what you have<br className="hidden sm:block" />
            <span className="text-brand-600"> for what you need.</span>
          </h1>

          <p className="text-lg sm:text-xl text-earth-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with local people to exchange skills, services, goods, and help —
            and build real community through barter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto shadow-lg">
                🌱 Join the Tree
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Browse Local Trades
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-earth-400">Free to join · No cash required · Real neighbors</p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-earth-800 mb-3">How it works</h2>
            <p className="text-earth-500 max-w-xl mx-auto">
              No payments. No middlemen. Just neighbors helping neighbors.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="font-semibold text-earth-800 text-lg mb-2">{step.title}</h3>
                <p className="text-earth-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Barter examples ── */}
      <section className="py-20 px-4 sm:px-6 bg-bark-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-earth-800 mb-3">Real trades happen every day</h2>
            <p className="text-earth-500 max-w-xl mx-auto">
              When neighbors trade skills, everybody wins.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXAMPLES.map((ex, i) => (
              <div key={i} className="bg-white rounded-2xl border border-bark-200 p-5 flex items-center gap-4">
                <span className="text-3xl">{ex.emoji}</span>
                <div>
                  <p className="font-medium text-earth-800 text-sm">{ex.a}</p>
                  <p className="text-brand-600 text-sm font-semibold mt-0.5">↔ {ex.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent members ── */}
      {recentUsers.length > 0 && (
        <section className="py-20 px-4 sm:px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-earth-800 mb-3">Meet your neighbors</h2>
              <p className="text-earth-500 max-w-xl mx-auto">
                Real people in your area ready to trade.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentUsers.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/browse">
                <Button variant="secondary" size="lg">
                  Browse all local traders →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Trust / Community CTA ── */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-5">🌳</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            This Is Our Town.<br />Where local value grows.
          </h2>
          <p className="text-brand-100 text-lg mb-8 leading-relaxed">
            Join a growing community of neighbors who trade skills and services
            instead of cash — and build real, lasting relationships in the process.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-white text-brand-700 hover:bg-brand-50 shadow-lg"
            >
              🌱 Join the Tree — it&apos;s free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
