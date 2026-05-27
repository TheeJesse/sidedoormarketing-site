'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    description: 'Get started and explore your community.',
    cta: 'Join for free',
    ctaVariant: 'secondary' as const,
    highlight: false,
    features: [
      'Public barter profile',
      'Up to 5 offers + 5 needs',
      'Browse local traders',
      'Basic match suggestions',
      'Profile photo',
    ],
    missing: [
      'Priority in search results',
      'Unlimited offers & needs',
      'Contact reveal without login',
      'Trade activity badge',
    ],
  },
  {
    id: 'neighbor',
    name: 'Neighbor',
    monthly: 9,
    annual: 7,
    description: 'For active traders building real community.',
    cta: 'Start trading',
    ctaVariant: 'primary' as const,
    highlight: true,
    badge: 'Most popular',
    features: [
      'Everything in Free',
      'Unlimited offers & needs',
      'Priority in search results',
      'Top match notifications',
      'Trusted Neighbor badge',
      'Contact reveal without login',
    ],
    missing: [
      'Business listing',
      'Featured placement',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 29,
    annual: 23,
    description: 'For service providers and local businesses.',
    cta: 'Go Pro',
    ctaVariant: 'secondary' as const,
    highlight: false,
    features: [
      'Everything in Neighbor',
      'Business / organization listing',
      'Featured placement in browse',
      'Multiple service areas',
      'Priority support',
      'Early access to new features',
    ],
    missing: [],
  },
]

const FAQ = [
  {
    q: 'Is This Is Our Town really free to use?',
    a: 'Yes. You can create a profile, list offers and needs, browse traders, and get matched — all for free. The paid plans unlock extras like unlimited listings, priority placement, and trust badges.',
  },
  {
    q: 'Do I need to pay to contact someone?',
    a: 'Free users can view contact info on any profile. Neighbor and Pro members get their contact info shown more prominently without requiring a login to view.',
  },
  {
    q: 'How does the annual billing discount work?',
    a: 'Switch to annual and you get roughly 2 months free — Neighbor drops from $9/mo to $7/mo, Pro from $29/mo to $23/mo. You\'re billed once per year.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime from your dashboard. You keep access until the end of your billing period.',
  },
  {
    q: 'What is a Trusted Neighbor badge?',
    a: 'It\'s a visible signal on your profile that shows you\'re an active, paying member of the community. We\'ll be adding verified trade reviews soon.',
  },
  {
    q: 'Is there a Stripe or payment integration yet?',
    a: 'Not yet — this is an early access period. Sign up now for free, and paid plans will activate soon. Early members may receive founding member pricing.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-bark-50 to-earth-50 border-b border-bark-200 py-16 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
            <span>🌳</span> Simple, honest pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-earth-800 leading-tight mb-4">
            Grow your local<br />barter network
          </h1>
          <p className="text-earth-500 text-lg mb-8">
            Start free. Upgrade when you&apos;re ready to trade more.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-bark-200 rounded-full px-4 py-2 shadow-sm">
            <span className={`text-sm font-medium ${!annual ? 'text-earth-800' : 'text-earth-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              className={`relative w-11 h-6 rounded-full transition-colors ${annual ? 'bg-brand-500' : 'bg-earth-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-5' : ''}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-earth-800' : 'text-earth-400'}`}>
              Annual <span className="text-brand-600 font-semibold">Save ~20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-7 flex flex-col relative ${
                  plan.highlight
                    ? 'border-brand-400 shadow-lg ring-2 ring-brand-200'
                    : 'border-bark-200 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="font-bold text-earth-800 text-lg">{plan.name}</h2>
                  <p className="text-earth-400 text-sm mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-earth-800">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    {plan.monthly > 0 && (
                      <span className="text-earth-400 text-sm pb-1.5">/mo{annual ? ', billed annually' : ''}</span>
                    )}
                    {plan.monthly === 0 && (
                      <span className="text-earth-400 text-sm pb-1.5">forever</span>
                    )}
                  </div>
                </div>

                <Link
                  href={plan.monthly === 0 ? '/auth/signup' : `/auth/signup?plan=${plan.id}&billing=${annual ? 'annual' : 'monthly'}`}
                  className="mb-6"
                >
                  <Button variant={plan.ctaVariant} className="w-full" size="md">
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-earth-700">
                      <span className="text-brand-500 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-earth-300 line-through">
                      <span className="mt-0.5 flex-shrink-0">✗</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="py-10 px-4 sm:px-6 bg-bark-50 border-y border-bark-200">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { stat: '100%', label: 'Free to start' },
            { stat: 'Local', label: 'Community-first' },
            { stat: 'No fees', label: 'On trades' },
            { stat: 'Cancel', label: 'Anytime' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-2xl font-extrabold text-brand-600">{s.stat}</div>
              <div className="text-sm text-earth-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-earth-800 text-center mb-10">Common questions</h2>
          <div className="flex flex-col divide-y divide-bark-200 border border-bark-200 rounded-2xl overflow-hidden">
            {FAQ.map((item, i) => (
              <div key={i}>
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-bark-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-earth-800 text-sm">{item.q}</span>
                  <span className={`text-earth-400 text-lg flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-earth-500 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-4xl mb-4">🌳</div>
          <h2 className="text-3xl font-bold mb-3">Ready to start trading?</h2>
          <p className="text-brand-100 mb-8">
            Join your neighbors on This Is Our Town — free forever, upgrade when it makes sense.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-lg w-full sm:w-auto">
                🌱 Join for free
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="ghost" className="text-white hover:bg-brand-500 w-full sm:w-auto">
                Browse local trades
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
