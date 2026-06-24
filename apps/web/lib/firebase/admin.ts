import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let cached: Auth | null = null

function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

function createAdminApp(): App {
  if (getApps().length > 0) return getApp()

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
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

export function getFirebaseAdminAuth(): Auth {
  if (cached) return cached
  const app = createAdminApp()
  cached = getAuth(app)
  return cached
}
