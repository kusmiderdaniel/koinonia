/**
 * Google Calendar Sync Endpoint
 *
 * POST /api/integrations/google-calendar/sync
 *
 * Triggers a full sync of all events to Google Calendar.
 * Can also sync a specific event if eventId is provided.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getConnectionByProfileId } from '@/lib/google-calendar/token-manager'
import { syncEventToGoogle, syncAllEventsForConnection } from '@/lib/google-calendar/sync-service'

export const dynamic = 'force-dynamic'

interface SyncBody {
  eventId?: string
  fullSync?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile
    const adminClient = createServiceRoleClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Parse request body
    let body: SyncBody = {}
    try {
      body = await request.json()
    } catch {
      // No body - default to full sync
    }

    // Get existing connection
    const connection = await getConnectionByProfileId(profile.id)

    if (!connection) {
      return NextResponse.json(
        { error: 'No Google Calendar connection found' },
        { status: 404 }
      )
    }

    if (!connection.isActive || connection.requiresReauth) {
      return NextResponse.json(
        { error: 'Google Calendar connection is not active. Please reconnect.' },
        { status: 400 }
      )
    }

    let result

    if (body.eventId) {
      // Sync a specific event
      result = await syncEventToGoogle(body.eventId)
    } else {
      // Full sync
      result = await syncAllEventsForConnection(connection.id)
    }

    return NextResponse.json({
      success: result.success,
      synced: result.synced,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    console.error('Google Calendar sync error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync' },
      { status: 500 }
    )
  }
}
