'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      if (status === 'authenticated') {
        await signOut({ redirect: false })
      }
      router.push(`/auth/verify-pending?email=${encodeURIComponent(form.email)}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const canSubmit = form.name && form.email && form.password.length >= 6

  return (
    <div className="min-h-screen bg-bark-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌳</div>
          <h1 className="text-2xl font-bold text-earth-800">Join Our Town</h1>
          <p className="text-earth-500 text-sm mt-1">Create your free barter profile</p>
        </div>

        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full name"
              id="name"
              placeholder="Jesse Smith"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
            <Input
              label="Email address"
              id="email"
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
            <Input
              label="Password (min 6 characters)"
              id="password"
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
            />
            <Button type="submit" disabled={loading || !canSubmit} className="mt-2">
              {loading ? 'Creating account…' : '🌳 Create account'}
            </Button>
          </form>
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
