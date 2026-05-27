'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const STEPS = ['Account', 'Location', 'About You', 'Exchange']

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    city: '',
    state: '',
    zip: '',
    bio: '',
    radius: '25',
    contactMethod: 'email',
    contactValue: '',
    offerInput: '',
    needInput: '',
    offers: [] as string[],
    needs: [] as string[],
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function addOffer() {
    if (!form.offerInput.trim()) return
    setForm(f => ({ ...f, offers: [...f.offers, f.offerInput.trim()], offerInput: '' }))
  }

  function addNeed() {
    if (!form.needInput.trim()) return
    setForm(f => ({ ...f, needs: [...f.needs, f.needInput.trim()], needInput: '' }))
  }

  function removeOffer(i: number) {
    setForm(f => ({ ...f, offers: f.offers.filter((_, idx) => idx !== i) }))
  }

  function removeNeed(i: number) {
    setForm(f => ({ ...f, needs: f.needs.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      // Create user
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          city: form.city,
          state: form.state,
          zip: form.zip,
          bio: form.bio,
          radius: Number(form.radius),
          contactMethod: form.contactMethod,
          contactValue: form.contactValue || form.email,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      const newUser = await res.json()

      // Sign in
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })

      // Add offers
      for (const title of form.offers) {
        await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
      }

      // Add needs
      for (const title of form.needs) {
        await fetch('/api/needs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const canNext = [
    form.name && form.email && form.password.length >= 6,
    form.city && form.state,
    true, // bio optional
    true, // offers/needs optional
  ][step]

  return (
    <div className="min-h-screen bg-bark-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌳</div>
          <h1 className="text-2xl font-bold text-earth-800">Join Our Town</h1>
          <p className="text-earth-500 text-sm mt-1">Create your free barter profile</p>
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
                <div className={`h-px w-6 ${i < step ? 'bg-brand-400' : 'bg-earth-200'}`} />
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

          {/* Step 0: Account */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <Input label="Full name" id="name" placeholder="Jesse Smith" value={form.name}
                onChange={e => set('name', e.target.value)} />
              <Input label="Email address" id="email" type="email" placeholder="you@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
              <Input label="Password (min 6 characters)" id="password" type="password" value={form.password}
                onChange={e => set('password', e.target.value)} />
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" id="city" placeholder="Milton" value={form.city}
                  onChange={e => set('city', e.target.value)} />
                <Input label="State" id="state" placeholder="FL" value={form.state}
                  onChange={e => set('state', e.target.value)} />
              </div>
              <Input label="Zip code" id="zip" placeholder="32570" value={form.zip}
                onChange={e => set('zip', e.target.value)} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-earth-700">Service radius (miles)</label>
                <select
                  value={form.radius}
                  onChange={e => set('radius', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {['5', '10', '15', '25', '50', '100'].map(r => (
                    <option key={r} value={r}>{r} miles</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: About */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-earth-700">Short bio <span className="text-earth-400">(optional)</span></label>
                <textarea
                  placeholder="Tell people who you are and what you're about…"
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-earth-700">Preferred contact</label>
                <select
                  value={form.contactMethod}
                  onChange={e => set('contactMethod', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <Input
                label="Contact value (email or phone shown on your profile)"
                id="contactValue"
                placeholder="Leave blank to use your signup email"
                value={form.contactValue}
                onChange={e => set('contactValue', e.target.value)}
              />
            </div>
          )}

          {/* Step 3: Exchange */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              {/* Offers */}
              <div>
                <label className="text-sm font-medium text-earth-700 block mb-2">
                  What do you offer? <span className="text-earth-400">(add as many as you like)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="e.g. Fence repair"
                    value={form.offerInput}
                    onChange={e => set('offerInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOffer())}
                  />
                  <Button size="sm" onClick={addOffer} type="button">Add</Button>
                </div>
                {form.offers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.offers.map((o, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm px-3 py-1 rounded-full">
                        {o}
                        <button onClick={() => removeOffer(i)} className="hover:text-brand-900 text-brand-400 text-xs">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Needs */}
              <div>
                <label className="text-sm font-medium text-earth-700 block mb-2">
                  What do you need? <span className="text-earth-400">(add as many as you like)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="e.g. Electrician"
                    value={form.needInput}
                    onChange={e => set('needInput', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNeed())}
                  />
                  <Button size="sm" onClick={addNeed} type="button">Add</Button>
                </div>
                {form.needs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.needs.map((n, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-sm px-3 py-1 rounded-full">
                        {n}
                        <button onClick={() => removeNeed(i)} className="hover:text-amber-900 text-amber-400 text-xs">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8 gap-3">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Back</Button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext}>
                Continue →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating profile…' : '🌳 Create my profile'}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-earth-400 mt-6">
          Already have a profile?{' '}
          <Link href="/auth/login" className="text-brand-600 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
