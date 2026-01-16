/**
 * Google Calendar Disconnect Endpoint
 *
 * POST /api/integrations/google-calendar/disconnect
 *
 * Disconnects the user's Google Calendar integration:
 * 1. Revokes the OAuth token with Google
 * 2. Deletes calendars from user's Google account (optional)
 * 3. Deletes the connection from database
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getConnectionByProfileId, deleteConnection, getValidTokens } from '@/lib/google-calendar/token-manager'
import { createAuthenticatedOAuth2Client } from '@/lib/google-calendar/client'

export const dynamic = 'force-dynamic'

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

    // Get existing connection
    const connection = await getConnectionByProfileId(profile.id)

    if (!connection) {
      return NextResponse.json(
        { error: 'No Google Calendar connection found' },
        { status: 404 }
      )
    }

    // Parse request body for options
    let deleteCalendars = false
    try {
      const body = await request.json()
      deleteCalendars = body.deleteCalendars === true
    } catch {
      // No body or invalid JSON - use defaults
    }

    // Try to revoke the token with Google (optional - don't fail if this doesn't work)
    try {
      const tokens = await getValidTokens(connection.id)
      const auth = createAuthenticatedOAuth2Client({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiresAt.getTime(),
      })

      // Revoke the token
      await auth.revokeToken(tokens.accessToken)
    } catch (revokeError) {
      // Log but don't fail - the token might already be invalid
      console.warn('Failed to revoke Google token:', revokeError)
    }

    // If user wants to delete calendars from Google, do it before deleting connection
    if (deleteCalendars) {
      try {
        // Import calendar manager dynamically to avoid circular dependencies
        const { deleteAllCalendars } = await import('@/lib/google-calendar/calendar-manager')
        await deleteAllCalendars(connection.id)
      } catch (deleteError) {
        console.warn('Failed to delete Google calendars:', deleteError)
        // Continue with disconnect even if calendar deletion fails
      }
    }

    // Delete the connection from database (cascades to campus_calendars and synced_events)
    await deleteConnection(connection.id)

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    })
  } catch (error) {
    console.error('Google Calendar disconnect error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect' },
      { status: 500 }
    )
  }
}
