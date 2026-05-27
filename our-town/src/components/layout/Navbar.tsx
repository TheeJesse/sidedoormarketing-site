'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-bark-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌳</span>
            <div className="flex flex-col leading-tight">
              {/* Full brand name on md+, short on mobile */}
              <span className="hidden md:block font-bold text-brand-700 text-base tracking-tight">
                This Is Our Town
              </span>
              <span className="block md:hidden font-bold text-brand-700 text-base tracking-tight">
                Our Town
              </span>
              <span className="text-[10px] text-earth-400 font-normal hidden sm:block">
                Trade skills. Build community.
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-sm text-earth-600 hover:text-brand-600 font-medium transition-colors">
              Browse
            </Link>
            <Link href="/pricing" className="text-sm text-earth-600 hover:text-brand-600 font-medium transition-colors">
              Pricing
            </Link>
            {session && (
              <>
                <Link href="/dashboard" className="text-sm text-earth-600 hover:text-brand-600 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/matches" className="text-sm text-earth-600 hover:text-brand-600 font-medium transition-colors">
                  Matches
                </Link>
                {session.user.isAdmin && (
                  <Link href="/admin" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-earth-500">Hi, {session.user.name?.split(' ')[0]}</span>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                  Sign out
                </Button>
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Join the Tree</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-earth-600 hover:bg-bark-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-bark-200 px-4 py-4 flex flex-col gap-3">
          <Link href="/browse" className="text-sm text-earth-700 font-medium" onClick={() => setMenuOpen(false)}>
            Browse Local Trades
          </Link>
          <Link href="/pricing" className="text-sm text-earth-700 font-medium" onClick={() => setMenuOpen(false)}>
            Pricing
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-earth-700 font-medium" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link href="/matches" className="text-sm text-earth-700 font-medium" onClick={() => setMenuOpen(false)}>
                My Matches
              </Link>
              {session.user.isAdmin && (
                <Link href="/admin" className="text-sm text-amber-600 font-medium" onClick={() => setMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
              <button
                className="text-sm text-left text-earth-500"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">Log in</Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full">Join the Tree</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
