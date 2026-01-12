'use client'

// Firebase is loaded lazily to reduce initial bundle size (~200KB saved)
// Imports are done dynamically when push notification features are actually used

import type { FirebaseApp } from 'firebase/app'
import type { Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp | null = null
let firebaseModulesLoaded = false

/**
 * Lazily load Firebase modules
 */
async function loadFirebaseModules() {
  if (firebaseModulesLoaded) return

  // Dynamic import of Firebase modules
  const [{ initializeApp, getApps, getApp }] = await Promise.all([
    import('firebase/app'),
  ])

  // Check if all required config values are present
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('[Firebase] Missing configuration, push notifications disabled')
    return
  }

  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  firebaseModulesLoaded = true
}

/**
 * Get Firebase app instance (singleton)
 */
export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (typeof window === 'undefined') return null

  await loadFirebaseModules()
  return firebaseApp
}

/**
 * Get messaging instance (only available in browser with service worker support)
 */
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null

  const { isSupported, getMessaging } = await import('firebase/messaging')

  const supported = await isSupported()
  if (!supported) {
    console.warn('[Firebase] Messaging not supported in this browser')
    return null
  }

  const app = await getFirebaseApp()
  if (!app) return null

  return getMessaging(app)
}

/**
 * Request FCM token after getting notification permission
 */
export async function requestFCMToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return null

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[Firebase] Notification permission denied')
      return null
    }

    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready

    // Pass Firebase config to service worker
    registration.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: firebaseConfig,
    })

    // Get FCM token - dynamic import
    const { getToken } = await import('firebase/messaging')
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    return token
  } catch (error) {
    console.error('[Firebase] Failed to get FCM token:', error)
    return null
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: {
  notification?: { title?: string; body?: string }
  data?: Record<string, string>
}) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  let unsubscribe: (() => void) | null = null

  getMessagingInstance().then(async (messaging) => {
    if (messaging) {
      const { onMessage } = await import('firebase/messaging')
      unsubscribe = onMessage(messaging, callback)
    }
  })

  return () => {
    if (unsubscribe) {
      unsubscribe()
    }
  }
}

/**
 * Check if push notifications are supported
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const { isSupported } = await import('firebase/messaging')

  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    (await isSupported())
  )
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}
