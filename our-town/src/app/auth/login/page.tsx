'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      if (result.error.includes('verify-email')) {
        router.push(`/auth/verify-pending?email=${encodeURIComponent(email)}`)
      } else {
        setError('Invalid email or password.')
      }
      setLoading(false)
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen bg-bark-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌳</div>
          <h1 className="text-2xl font-bold text-earth-800">Welcome back</h1>
          <p className="text-earth-500 text-sm mt-1">Log in to Our Town</p>
        </div>

        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-8">
          {params.get('error') === 'SessionRequired' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm">
              Please log in to continue.
            </div>
          )}

          {params.get('verified') === 'true' && (
            <div className="mb-4 p-3 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl text-sm">
              ✓ Email verified! You can now log in.
            </div>
          )}

          {params.get('error') === 'invalid-token' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              Invalid verification link. Please request a new one.
            </div>
          )}

          {params.get('error') === 'token-expired' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              Verification link has expired. Please request a new one.
            </div>
          )}

          {params.get('error') === 'verify-email' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm">
              Please verify your email before logging in. Check your inbox for the verification link.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? 'Logging in…' : 'Log in →'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-bark-50 rounded-xl text-xs text-earth-500 border border-bark-200">
            <strong>Demo accounts:</strong> jesse@demo.com, maria@demo.com, bob@demo.com, lisa@demo.com<br />
            Password for all: <strong>demo1234</strong>
          </div>
        </div>

        <p className="text-center text-sm text-earth-400 mt-6">
          Don&apos;t have a profile?{' '}
          <Link href="/auth/signup" className="text-brand-600 hover:underline font-medium">
            Join the Tree
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
