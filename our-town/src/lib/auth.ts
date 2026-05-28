import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        if (!user.emailVerified && !user.isAdmin) {
          throw new Error('verify-email')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          plan: user.plan,
          emailVerified: !!user.emailVerified,
          onboardingComplete: user.onboardingComplete,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false
        token.plan = (user as { plan?: string }).plan ?? 'free'
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified ?? false
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false
      }
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } })
        if (dbUser) {
          token.plan = dbUser.plan
          token.emailVerified = !!dbUser.emailVerified
          token.onboardingComplete = dbUser.onboardingComplete
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.plan = (token.plan as string) ?? 'free'
        session.user.emailVerified = token.emailVerified as boolean
        session.user.onboardingComplete = token.onboardingComplete as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
