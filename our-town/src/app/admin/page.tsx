'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

type AdminUser = {
  id: string; name: string; email: string; city: string | null; state: string | null
  isApproved: boolean; isHidden: boolean; isAdmin: boolean; createdAt: string
  _count: { offers: number; needs: number }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'hidden' | 'unapproved'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
    if (status === 'authenticated' && !session?.user.isAdmin) router.push('/dashboard')
  }, [status, session, router])

  useEffect(() => {
    if (session?.user.isAdmin) {
      fetch('/api/admin/users')
        .then(r => r.json())
        .then((data: AdminUser[]) => {
          setUsers(data)
          setLoading(false)
        })
    }
  }, [session])

  async function update(id: string, patch: Partial<AdminUser>) {
    await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setUsers(u => u.map(user => user.id === id ? { ...user, ...patch } : user))
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user and all their data? This cannot be undone.')) return
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsers(u => u.filter(user => user.id !== id))
  }

  const filtered = users.filter(u => {
    if (filter === 'hidden') return u.isHidden
    if (filter === 'unapproved') return !u.isApproved
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <p className="text-earth-400">Loading admin panel…</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-earth-800">Admin Panel</h1>
          <Badge variant="amber">Our Town Admin</Badge>
        </div>
        <p className="text-earth-500">Manage users, profiles, and community listings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total users', value: users.length, icon: '👥' },
          { label: 'Active', value: users.filter(u => !u.isHidden && u.isApproved).length, icon: '✅' },
          { label: 'Hidden', value: users.filter(u => u.isHidden).length, icon: '🚫' },
          { label: 'Unapproved', value: users.filter(u => !u.isApproved).length, icon: '⏳' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-bark-200 p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-earth-800">{s.value}</div>
            <div className="text-xs text-earth-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-earth-100 p-1 rounded-xl mb-6 w-fit">
        {(['all', 'hidden', 'unapproved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f ? 'bg-white text-earth-800 shadow-sm' : 'text-earth-500 hover:text-earth-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* User table */}
      <div className="bg-white rounded-2xl border border-bark-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-earth-400">
            No users in this category.
          </div>
        ) : (
          <div className="divide-y divide-bark-100">
            {filtered.map(user => (
              <div key={user.id} className="p-4 flex items-start gap-4 hover:bg-bark-50 transition-colors">
                <Avatar name={user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/profile/${user.id}`} className="font-semibold text-earth-800 hover:text-brand-600 transition-colors">
                      {user.name}
                    </Link>
                    {user.isHidden && <Badge variant="red">Hidden</Badge>}
                    {!user.isApproved && <Badge variant="amber">Unapproved</Badge>}
                    {user.isAdmin && <Badge variant="blue">Admin</Badge>}
                  </div>
                  <p className="text-xs text-earth-400 mt-0.5">
                    {user.email} · {[user.city, user.state].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-xs text-earth-400 mt-0.5">
                    {user._count.offers} offers · {user._count.needs} needs ·
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <Button
                    size="sm"
                    variant={user.isHidden ? 'secondary' : 'ghost'}
                    onClick={() => update(user.id, { isHidden: !user.isHidden })}
                  >
                    {user.isHidden ? 'Unhide' : 'Hide'}
                  </Button>
                  <Button
                    size="sm"
                    variant={user.isApproved ? 'ghost' : 'secondary'}
                    onClick={() => update(user.id, { isApproved: !user.isApproved })}
                  >
                    {user.isApproved ? 'Unapprove' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
