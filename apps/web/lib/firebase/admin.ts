import type { App, ServiceAccount } from 'firebase-admin/app'
import type { Auth } from 'firebase-admin/auth'

let cached: Auth | null = null

function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

async function createAdminApp(): Promise<App> {
  const { initializeApp, cert, getApps, getApp } = await import('firebase-admin/app')

  if (getApps().length > 0) return getApp()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount),
    })
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp()
  }

  throw new Error(
    'Missing Firebase Admin credentials. Set either GOOGLE_APPLICATION_CREDENTIALS ' +
    'or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
  )
}

export async function getFirebaseAdminAuth(): Promise<Auth> {
  if (cached) return cached
  const app = await createAdminApp()
  const { getAuth } = await import('firebase-admin/auth')
  cached = getAuth(app)
  return cached
}
