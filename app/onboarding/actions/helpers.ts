import { headers } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Data categories shared with church administrators
export const DATA_SHARING_CATEGORIES = [
  'name',
  'email',
  'phone',
  'ministry_assignments',
  'event_participation',
]

// Helper function to record data sharing consent when joining a church
export async function recordDataSharingConsent(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  churchId: string
) {
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                    headersList.get('x-real-ip') ||
                    null
  const userAgent = headersList.get('user-agent') || null

  await adminClient.from('consent_records').insert({
    user_id: userId,
    church_id: churchId,
    consent_type: 'data_sharing',
    action: 'granted',
    ip_address: ipAddress,
    user_agent: userAgent,
    data_categories_shared: DATA_SHARING_CATEGORIES,
    context: { source: 'join_church_flow' },
  })
}
