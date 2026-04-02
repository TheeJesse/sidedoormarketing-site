import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-earth-800 text-earth-200 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌳</span>
              <span className="font-bold text-white text-base">This Is Our Town</span>
            </div>
            <p className="text-sm text-earth-400 leading-relaxed">
              Trade skills. Build community.<br />
              Real exchanges between real neighbors.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-earth-400">
              <li><Link href="/browse" className="hover:text-white transition-colors">Browse Trades</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join the Tree</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Log In</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">About</h4>
            <p className="text-sm text-earth-400 leading-relaxed">
              This Is Our Town is a local skill-and-service exchange platform.
              Built to help neighbors trade value and build real relationships.
            </p>
          </div>
        </div>

        <div className="border-t border-earth-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-earth-500">
          <span>© {new Date().getFullYear()} This Is Our Town. All rights reserved.</span>
          <span>Where local value grows. 🌱</span>
        </div>
      </div>
    </footer>
  )
}
