'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Suspense } from 'react'

function VerifyPendingContent() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [resent, setResent] = useState(false)
  const [sending, setSending] = useState(false)

  async function resend() {
    if (!email) return
    setSending(true)
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSending(false)
    setResent(true)
  }

  return (
    <div className="min-h-screen bg-bark-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">📬</div>
        <h1 className="text-2xl font-bold text-earth-800 mb-2">Check your email</h1>
        <p className="text-earth-500 mb-2">
          We sent a verification link to
        </p>
        {email && (
          <p className="font-semibold text-earth-700 mb-6">{email}</p>
        )}
        <p className="text-sm text-earth-400 mb-8">
          Click the link in the email to verify your account, then come back and log in.
        </p>

        <div className="bg-white rounded-2xl border border-bark-200 shadow-sm p-6 flex flex-col gap-4">
          {email && (
            <Button
              variant="secondary"
              onClick={resend}
              disabled={sending || resent}
            >
              {resent ? '✓ Email resent' : sending ? 'Sending…' : 'Resend verification email'}
            </Button>
          )}

          <Link href="/auth/login">
            <Button className="w-full">Go to login</Button>
          </Link>
        </div>

        <p className="text-xs text-earth-400 mt-6">
          Didn&apos;t get the email? Check your spam folder.
        </p>
      </div>
    </div>
  )
}

export default function VerifyPendingPage() {
  return (
    <Suspense>
      <VerifyPendingContent />
    </Suspense>
  )
}
