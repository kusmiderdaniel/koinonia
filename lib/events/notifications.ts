/**
 * Custom event system for notification refresh.
 * Used to trigger immediate notification count updates when an invitation is responded to.
 */

export const NOTIFICATION_REFRESH_EVENT = 'notification-refresh'

/**
 * Dispatch a notification refresh event.
 * Call this after responding to an invitation to trigger immediate UI updates.
 */
export function dispatchNotificationRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_REFRESH_EVENT))
  }
}

/**
 * Hook helper to listen for notification refresh events.
 * @param callback - Function to call when refresh event is dispatched
 * @returns Cleanup function to remove the listener
 */
export function onNotificationRefresh(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(NOTIFICATION_REFRESH_EVENT, callback)
  return () => window.removeEventListener(NOTIFICATION_REFRESH_EVENT, callback)
}
