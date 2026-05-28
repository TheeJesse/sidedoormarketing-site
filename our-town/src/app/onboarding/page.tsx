'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const STEPS = ['Your Location', 'What You Offer', 'What You Need']

type Category = { id: string; name: string; icon: string | null }

export default function OnboardingPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [location, setLocation] = useState({
    city: '',
    state: '',
    zip: '',
    radius: '25',
  })

  const [offers, setOffers] = useState<{ id: string; title: string; category: { name: string; icon: string | null } | null }[]>([])
  const [offerInput, setOfferInput] = useState('')
  const [offerCat, setOfferCat] = useState('')

  const [needs, setNeeds] = useState<{ id: string; title: string; category: { name: string; icon: string | null } | null }[]>([])
  const [needInput, setNeedInput] = useState('')
  const [needCat, setNeedCat] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (session?.user.onboardingComplete) {
      router.push('/dashboard')
    }
  }, [session, router])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [])

  async function saveLocation() {
    if (!session) return
    setSaving(true)
    setError('')
    await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: location.city,
        state: location.state,
        zip: location.zip,
        radius: Number(location.radius),
      }),
    })
    setSaving(false)
    setStep(1)
  }

  async function addOffer() {
    if (!offerInput.trim()) return
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: offerInput.trim(), categoryId: offerCat || null }),
    })
    if (res.ok) {
      const offer = await res.json()
      setOffers(o => [...o, offer])
      setOfferInput('')
      setOfferCat('')
    }
  }

  async function removeOffer(id: string) {
    await fetch(`/api/offers/${id}`, { method: 'DELETE' })
    setOffers(o => o.filter(x => x.id !== id))
  }

  async function addNeed() {
    if (!needInput.trim()) return
    const res = await fetch('/api/needs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: needInput.trim(), categoryId: needCat || null }),
    })
    if (res.ok) {
      const need = await res.json()
      setNeeds(n => [...n, need])
      setNeedInput('')
      setNeedCat('')
    }
  }

  async function removeNeed(id: string) {
    await fetch(`/api/needs/${id}`, { method: 'DELETE' })
    setNeeds(n => n.filter(x => x.id !== id))
  }

  async function finish() {
    if (!session) return
    setSaving(true)
    await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingComplete: true }),
    })
    await update()
    router.push('/dashboard')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bark-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌳</div>
          <p className="text-earth-400">Loading…</p>
        </div>
      </div>
    )
  }

  const canNextLocation = location.city && location.state

  return (
    <div className="min-h-screen bg-bark-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌳</div>
          <h1 className="text-2xl font-bold text-earth-800">Set up your profile</h1>
          <p className="text-earth-500 text-sm mt-1">Just 3 quick steps to start trading</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${i < step ? 'bg-brand-500 text-white' :
                    i === step ? 'bg-brand-600 text-white ring-2 ring-brand-300' :
                    'bg-earth-100 text-earth-400'}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-8 ${i < step ? 'bg-brand-400' : 'bg-earth-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-8">
          <h2 className="font-semibold text-earth-700 text-sm uppercase tracking-wider mb-6">
            Step {step + 1}: {STEPS[step]}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Step 0: Location */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" id="city" placeholder="Milton" value={location.city}
                  onChange={e => setLocation(l => ({ ...l, city: e.target.value }))} />
                <Input label="State" id="state" placeholder="FL" value={location.state}
                  onChange={e => setLocation(l => ({ ...l, state: e.target.value }))} />
              </div>
              <Input label="Zip code" id="zip" placeholder="32570" value={location.zip}
                onChange={e => setLocation(l => ({ ...l, zip: e.target.value }))} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-earth-700">Service radius</label>
                <select
                  value={location.radius}
                  onChange={e => setLocation(l => ({ ...l, radius: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {['5', '10', '15', '25', '50', '100'].map(r => (
                    <option key={r} value={r}>{r} miles</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Offers */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-earth-500">
                What skills, services, or goods can you offer? Add at least one.
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="e.g. Fence repair"
                  value={offerInput}
                  onChange={e => setOfferInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOffer())}
                />
                <select
                  value={offerCat}
                  onChange={e => setOfferCat(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <Button size="sm" onClick={addOffer} type="button">Add</Button>
              </div>
              {offers.length > 0 && (
                <ul className="space-y-2">
                  {offers.map(o => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-bark-100 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-brand-400">✦</span>
                        <span className="text-sm text-earth-700 font-medium truncate">{o.title}</span>
                        {o.category && <Badge variant="green">{o.category.icon} {o.category.name}</Badge>}
                      </div>
                      <button onClick={() => removeOffer(o.id)}
                        className="text-earth-300 hover:text-red-400 transition-colors text-xs flex-shrink-0">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Step 2: Needs */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-earth-500">
                What are you looking for? Add at least one.
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="e.g. Electrician"
                  value={needInput}
                  onChange={e => setNeedInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNeed())}
                />
                <select
                  value={needCat}
                  onChange={e => setNeedCat(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
                <Button size="sm" onClick={addNeed} type="button">Add</Button>
              </div>
              {needs.length > 0 && (
                <ul className="space-y-2">
                  {needs.map(n => (
                    <li key={n.id} className="flex items-center justify-between gap-3 py-2 border-b border-bark-100 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-amber-400">✦</span>
                        <span className="text-sm text-earth-700 font-medium truncate">{n.title}</span>
                        {n.category && <Badge variant="amber">{n.category.icon} {n.category.name}</Badge>}
                      </div>
                      <button onClick={() => removeNeed(n.id)}
                        className="text-earth-300 hover:text-red-400 transition-colors text-xs flex-shrink-0">
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8 gap-3">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Back</Button>
            ) : (
              <div />
            )}
            {step === 0 && (
              <Button onClick={saveLocation} disabled={!canNextLocation || saving}>
                {saving ? 'Saving…' : 'Continue →'}
              </Button>
            )}
            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={offers.length === 0}>
                Continue →
              </Button>
            )}
            {step === 2 && (
              <Button onClick={finish} disabled={needs.length === 0 || saving}>
                {saving ? 'Finishing…' : '🌳 Start trading'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
