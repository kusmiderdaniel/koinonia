import { getFirebaseMessaging } from '@/lib/firebase/admin'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  icon?: string
  badge?: string
}

export interface PushResult {
  success: boolean
  sentCount: number
  failedCount: number
}

/**
 * Send push notification to a single user (all their devices)
 */
export async function sendPushToUser(
  profileId: string,
  payload: PushNotificationPayload
): Promise<PushResult> {
  const messaging = getFirebaseMessaging()
  if (!messaging) {
    console.warn('[Push] Firebase messaging not initialized')
    return { success: false, sentCount: 0, failedCount: 0 }
  }

  const adminClient = createServiceRoleClient()

  // Get all tokens for this user
  const { data: tokens, error } = await adminClient
    .from('push_tokens')
    .select('id, token')
    .eq('profile_id', profileId)

  if (error) {
    console.error('[Push] Failed to fetch tokens:', error)
    return { success: false, sentCount: 0, failedCount: 0 }
  }

  if (!tokens || tokens.length === 0) {
    // No tokens registered, not an error
    return { success: true, sentCount: 0, failedCount: 0 }
  }

  let sentCount = 0
  let failedCount = 0
  const invalidTokenIds: string[] = []

  for (const { id, token } of tokens) {
    try {
      await messaging.send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        webpush: {
          notification: {
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/icons/icon-72x72.png',
            requireInteraction: true,
          },
          fcmOptions: {
            link: '/dashboard',
          },
        },
      })
      sentCount++

      // Update last_used_at
      await adminClient
        .from('push_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id)
    } catch (err: unknown) {
      const error = err as { code?: string }
      console.error('[Push] Failed to send to token:', error.code)
      failedCount++

      // Remove invalid tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokenIds.push(id)
      }
    }
  }

  // Clean up invalid tokens
  if (invalidTokenIds.length > 0) {
    await adminClient.from('push_tokens').delete().in('id', invalidTokenIds)
    console.log(`[Push] Cleaned up ${invalidTokenIds.length} invalid tokens`)
  }

  return { success: true, sentCount, failedCount }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  profileIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  let totalSent = 0
  let totalFailed = 0

  for (const profileId of profileIds) {
    const result = await sendPushToUser(profileId, payload)
    totalSent += result.sentCount
    totalFailed += result.failedCount
  }

  return { success: true, totalSent, totalFailed }
}
