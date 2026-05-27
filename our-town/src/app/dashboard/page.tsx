'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

type Category = { id: string; name: string; icon: string | null }
type Offer = { id: string; title: string; category: { name: string; icon: string | null } | null }
type Need = { id: string; title: string; category: { name: string; icon: string | null } | null }
type UserProfile = {
  id: string; name: string; email: string; city: string | null; state: string | null
  zip: string | null; bio: string | null; radius: number; contactMethod: string | null
  contactValue: string | null; profilePhoto: string | null
  offers: Offer[]; needs: Need[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'offers' | 'needs'>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [editForm, setEditForm] = useState({ name: '', city: '', state: '', zip: '', bio: '', radius: '25', contactMethod: 'email', contactValue: '' })
  const [offerInput, setOfferInput] = useState('')
  const [offerCat, setOfferCat] = useState('')
  const [needInput, setNeedInput] = useState('')
  const [needCat, setNeedCat] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login?callbackUrl=/dashboard')
  }, [status, router])

  useEffect(() => {
    if (session?.user.id) {
      fetch(`/api/users/${session.user.id}`)
        .then(r => r.json())
        .then((data: UserProfile) => {
          setProfile(data)
          setEditForm({
            name: data.name || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            bio: data.bio || '',
            radius: String(data.radius || 25),
            contactMethod: data.contactMethod || 'email',
            contactValue: data.contactValue || '',
          })
        })
      fetch('/api/categories').then(r => r.json()).then(setCategories)
    }
  }, [session])

  async function saveProfile() {
    if (!session) return
    setSaving(true)
    await fetch(`/api/users/${session.user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, radius: Number(editForm.radius) }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function addOffer() {
    if (!offerInput.trim()) return
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: offerInput.trim(), categoryId: offerCat || null }),
    })
    const offer = await res.json()
    setProfile(p => p ? { ...p, offers: [...p.offers, offer] } : p)
    setOfferInput('')
    setOfferCat('')
  }

  async function removeOffer(id: string) {
    await fetch(`/api/offers/${id}`, { method: 'DELETE' })
    setProfile(p => p ? { ...p, offers: p.offers.filter(o => o.id !== id) } : p)
  }

  async function addNeed() {
    if (!needInput.trim()) return
    const res = await fetch('/api/needs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: needInput.trim(), categoryId: needCat || null }),
    })
    const need = await res.json()
    setProfile(p => p ? { ...p, needs: [...p.needs, need] } : p)
    setNeedInput('')
    setNeedCat('')
  }

  async function removeNeed(id: string) {
    await fetch(`/api/needs/${id}`, { method: 'DELETE' })
    setProfile(p => p ? { ...p, needs: p.needs.filter(n => n.id !== id) } : p)
  }

  if (status === 'loading' || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">🌳</div>
        <p className="text-earth-400">Loading your dashboard…</p>
      </div>
    )
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'offers' as const, label: `Offers (${profile.offers.length})`, icon: '🌱' },
    { id: 'needs' as const, label: `Looking For (${profile.needs.length})`, icon: '🔍' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} photoUrl={profile.profilePhoto} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-earth-800">{profile.name}</h1>
            <p className="text-earth-400 text-sm">{[profile.city, profile.state].filter(Boolean).join(', ')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/profile/${profile.id}`} target="_blank">
            <Button variant="secondary" size="sm">View public profile ↗</Button>
          </Link>
          <Link href="/matches">
            <Button size="sm">See matches</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-earth-100 p-1 rounded-xl mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-earth-800 shadow-sm'
                : 'text-earth-500 hover:text-earth-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-6">
          <h2 className="font-semibold text-earth-700 mb-5">Edit your profile</h2>
          <div className="flex flex-col gap-4">
            <Input label="Name" id="name" value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" id="city" value={editForm.city}
                onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
              <Input label="State" id="state" value={editForm.state}
                onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <Input label="Zip" id="zip" value={editForm.zip}
              onChange={e => setEditForm(f => ({ ...f, zip: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-earth-700">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-earth-700">Service radius</label>
                <select
                  value={editForm.radius}
                  onChange={e => setEditForm(f => ({ ...f, radius: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {['5', '10', '15', '25', '50', '100'].map(r => (
                    <option key={r} value={r}>{r} miles</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-earth-700">Contact method</label>
                <select
                  value={editForm.contactMethod}
                  onChange={e => setEditForm(f => ({ ...f, contactMethod: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
            <Input label="Contact value (shown on your public profile)" id="contactValue"
              value={editForm.contactValue}
              onChange={e => setEditForm(f => ({ ...f, contactValue: e.target.value }))} />

            <Button onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Offers Tab */}
      {activeTab === 'offers' && (
        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-6">
          <h2 className="font-semibold text-earth-700 mb-5">What you offer</h2>

          {/* Add */}
          <div className="flex gap-2 mb-5">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Add an offer…"
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
            <Button size="sm" onClick={addOffer}>Add</Button>
          </div>

          {/* List */}
          {profile.offers.length === 0 ? (
            <p className="text-sm text-earth-400 py-4 text-center">No offers yet. Add what you can do!</p>
          ) : (
            <ul className="space-y-2">
              {profile.offers.map(o => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-bark-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-brand-400">✦</span>
                    <span className="text-sm text-earth-700 font-medium truncate">{o.title}</span>
                    {o.category && <Badge variant="green">{o.category.icon} {o.category.name}</Badge>}
                  </div>
                  <button
                    onClick={() => removeOffer(o.id)}
                    className="text-earth-300 hover:text-red-400 transition-colors text-xs flex-shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Needs Tab */}
      {activeTab === 'needs' && (
        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-6">
          <h2 className="font-semibold text-earth-700 mb-5">What you&apos;re looking for</h2>

          {/* Add */}
          <div className="flex gap-2 mb-5">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="What do you need…"
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
            <Button size="sm" onClick={addNeed}>Add</Button>
          </div>

          {/* List */}
          {profile.needs.length === 0 ? (
            <p className="text-sm text-earth-400 py-4 text-center">No needs listed yet. Add what you&apos;re looking for!</p>
          ) : (
            <ul className="space-y-2">
              {profile.needs.map(n => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-2 border-b border-bark-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-amber-400">✦</span>
                    <span className="text-sm text-earth-700 font-medium truncate">{n.title}</span>
                    {n.category && <Badge variant="amber">{n.category.icon} {n.category.name}</Badge>}
                  </div>
                  <button
                    onClick={() => removeNeed(n.id)}
                    className="text-earth-300 hover:text-red-400 transition-colors text-xs flex-shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
