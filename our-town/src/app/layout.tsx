import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/layout/SessionProvider'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'This Is Our Town — Trade Skills. Build Community.',
  description:
    'Connect with local people to exchange skills, services, goods, and help — and build real community through barter.',
  keywords: 'barter, skill trade, local exchange, community, services, DIY',
  openGraph: {
    title: 'This Is Our Town',
    description: 'Trade what you have for what you need. Local skill and service exchange.',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SessionProvider session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
