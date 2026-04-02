'use client'

import { useEffect, useState } from 'react'
import { UserCard } from '@/components/browse/UserCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type User = {
  id: string
  name: string
  city: string | null
  state: string | null
  bio: string | null
  radius: number
  profilePhoto: string | null
  offers: { id: string; title: string; category: { name: string; icon: string | null } | null }[]
  needs: { id: string; title: string; category: { name: string; icon: string | null } | null }[]
}

type Category = { id: string; name: string; icon: string | null }

export default function BrowsePage() {
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')

  async function load(kw = keyword, ct = city, cat = category) {
    setLoading(true)
    const params = new URLSearchParams()
    if (kw) params.set('keyword', kw)
    if (ct) params.set('city', ct)
    if (cat) params.set('category', cat)
    const res = await fetch('/api/users?' + params.toString())
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  function clearFilters() {
    setKeyword('')
    setCity('')
    setCategory('')
    load('', '', '')
  }

  const hasFilters = keyword || city || category

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-earth-800 mb-2">Browse Local Trades</h1>
        <p className="text-earth-500">Find neighbors in your area who are ready to trade skills and services.</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-bark-200 p-5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Search keyword"
            id="keyword"
            placeholder="fence, massage, web design…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Input
            label="City or area"
            id="city"
            placeholder="Milton, Pensacola…"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-earth-700">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-earth-200 bg-white text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Button variant="ghost" type="button" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-bark-200 p-5 animate-pulse h-52" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌿</div>
          <h3 className="text-xl font-semibold text-earth-700 mb-2">No traders found</h3>
          <p className="text-earth-400 mb-6">Try different keywords or browse without filters.</p>
          {hasFilters && (
            <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-earth-400 mb-5">
            {users.length} {users.length === 1 ? 'trader' : 'traders'} found
            {hasFilters ? ' matching your search' : ' in your community'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
