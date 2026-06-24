'use client'

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, FacebookAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) return null
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

const app = getFirebaseApp()
export const firebaseAuth = app ? getAuth(app) : null
export const facebookProvider = new FacebookAuthProvider()
