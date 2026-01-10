// Firebase Messaging Service Worker
// This handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Firebase config will be passed via message from main app
let firebaseConfig = null
let messagingInitialized = false

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config
    initializeFirebase()
  }
})

function initializeFirebase() {
  if (messagingInitialized || !firebaseConfig) return

  try {
    firebase.initializeApp(firebaseConfig)
    const messaging = firebase.messaging()
    messagingInitialized = true

    messaging.onBackgroundMessage((payload) => {
      console.log('[SW] Received background message:', payload)

      const notificationTitle = payload.notification?.title || 'Koinonia'
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: payload.data?.notification_id || 'default',
        data: payload.data,
        requireInteraction: true,
        actions: getNotificationActions(payload.data?.type),
      }

      self.registration.showNotification(notificationTitle, notificationOptions)
    })
  } catch (error) {
    console.error('[SW] Failed to initialize Firebase:', error)
  }
}

function getNotificationActions(type) {
  switch (type) {
    case 'position_invitation':
      return [
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ]
    default:
      return [{ action: 'view', title: 'View' }]
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  let url = '/dashboard'

  // Route to appropriate page based on notification type
  if (data.event_id) {
    url = `/dashboard/events?event=${data.event_id}`
  } else if (data.type === 'position_invitation') {
    url = '/dashboard/inbox'
  } else if (data.task_id) {
    url = `/dashboard/tasks?task=${data.task_id}`
  }

  // Handle action buttons
  if (event.action === 'accept' || event.action === 'decline') {
    // Open the inbox page for action handling
    url = '/dashboard/inbox'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data, action: event.action })
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(url)
    })
  )
})
