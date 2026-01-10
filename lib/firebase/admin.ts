import admin from 'firebase-admin'

let firebaseAdmin: admin.app.App | null = null

/**
 * Initialize Firebase Admin SDK (singleton pattern)
 */
function initializeFirebaseAdmin(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase Admin] Missing credentials, push notifications disabled')
    return null
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error)
    return null
  }
}

/**
 * Get Firebase Admin app instance
 */
export function getFirebaseAdmin(): admin.app.App | null {
  if (!firebaseAdmin) {
    firebaseAdmin = initializeFirebaseAdmin()
  }
  return firebaseAdmin
}

/**
 * Get Firebase Admin Messaging instance
 */
export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseAdmin()
  if (!app) return null
  return admin.messaging(app)
}
