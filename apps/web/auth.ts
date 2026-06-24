import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './lib/prisma'
import { getFirebaseAdminAuth } from './lib/firebase/admin'

function providerFromFirebase(providerId: string | undefined): string {
  if (providerId === 'google.com') return 'firebase-google'
  if (providerId === 'facebook.com') return 'firebase-facebook'
  return 'firebase'
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        idToken: { label: 'Firebase ID Token', type: 'text' },
      },
      authorize: async (credentials) => {
        if (credentials?.idToken) {
          try {
          const adminAuth = getFirebaseAdminAuth()
          const decoded = await adminAuth.verifyIdToken(credentials.idToken as string)
          const firebaseUser = await adminAuth.getUser(decoded.uid)

          const email = firebaseUser.email
          if (!email) return null

          let user = await prisma.user.findUnique({ where: { email } })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: firebaseUser.displayName,
                image: firebaseUser.photoURL,
              },
            })
          } else {
            const updateData: { name?: string; image?: string } = {}
            if (!user.name && firebaseUser.displayName) updateData.name = firebaseUser.displayName
            if (!user.image && firebaseUser.photoURL) updateData.image = firebaseUser.photoURL
            if (Object.keys(updateData).length > 0) {
              user = await prisma.user.update({ where: { id: user.id }, data: updateData })
            }
          }

          const provider = providerFromFirebase(firebaseUser.providerData[0]?.providerId)

          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider,
                providerAccountId: firebaseUser.uid,
              },
            },
            update: {},
            create: {
              userId: user.id,
              type: 'oauth',
              provider,
              providerAccountId: firebaseUser.uid,
            },
          })

          return { id: user.id, email: user.email, name: user.name }
          } catch (error) {
            console.error('Firebase authorize error:', error)
            return null
          }
        }

        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
