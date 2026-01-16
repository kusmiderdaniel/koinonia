/**
 * Google Calendar Connection Status Endpoint
 *
 * GET /api/integrations/google-calendar/status
 *
 * Returns the current status of the user's Google Calendar connection:
 * - Connection details
 * - Enabled calendars
 * - Available campuses for sync
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getConnectionByProfileId } from '@/lib/google-calendar/token-manager'
import type { GoogleCalendarConnectionResponse, CalendarInfo } from '@/lib/google-calendar/types'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Get user's profile with role
    const adminClient = createServiceRoleClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, church_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if user is admin or higher (can access church-wide calendar)
    const isAdmin = profile.role === 'admin' || profile.role === 'owner'

    // Get church name for calendar naming
    const { data: church } = await adminClient
      .from('churches')
      .select('name')
      .eq('id', profile.church_id)
      .single()

    const churchName = church?.name || 'Kościół'

    // Get existing connection
    const connection = await getConnectionByProfileId(profile.id)

    // Get user's campus memberships
    const { data: userCampuses } = await adminClient
      .from('profile_campuses')
      .select('campus_id')
      .eq('profile_id', profile.id)

    const userCampusIds = new Set(userCampuses?.map(uc => uc.campus_id) || [])

    // Get available campuses for the church
    const { data: campuses } = await adminClient
      .from('campuses')
      .select('id, name, color')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name')

    // Filter campuses based on role:
    // - Admins can see all campuses
    // - Others can only see campuses they belong to
    const availableCampuses = isAdmin
      ? (campuses || [])
      : (campuses || []).filter(c => userCampusIds.has(c.id))

    // If no connection, return disconnected status
    if (!connection) {
      const response: GoogleCalendarConnectionResponse = {
        connection: null,
        calendars: [],
        availableCampuses,
        canSyncChurchCalendar: isAdmin,
      }

      return NextResponse.json(response)
    }

    // Get campus calendars for this connection
    const { data: campusCalendars } = await adminClient
      .from('google_calendar_campus_calendars')
      .select('campus_id, google_calendar_id, sync_enabled')
      .eq('connection_id', connection.id)

    // Build calendars list
    const calendars: CalendarInfo[] = []

    // Church calendar (only for admins)
    if (isAdmin && connection.churchCalendarGoogleId) {
      calendars.push({
        type: 'church',
        googleCalendarId: connection.churchCalendarGoogleId,
        name: `${churchName} - Publiczny`,
        description: 'Publiczne wydarzenia całego kościoła',
        syncEnabled: connection.syncChurchCalendar,
      })
    }

    // Campus calendars (filtered by user's campus membership for non-admins)
    for (const campusCalendar of campusCalendars || []) {
      const campus = availableCampuses.find(c => c.id === campusCalendar.campus_id)
      // Only include if campus is in available list (already filtered by role)
      if (campus) {
        calendars.push({
          type: 'campus',
          googleCalendarId: campusCalendar.google_calendar_id,
          name: `${churchName} - ${campus.name}`,
          description: `Wydarzenia campusu ${campus.name}`,
          syncEnabled: campusCalendar.sync_enabled,
          campusId: campus.id,
          campusName: campus.name,
          campusColor: campus.color,
        })
      }
    }

    // Personal calendar
    if (connection.personalCalendarGoogleId) {
      calendars.push({
        type: 'personal',
        googleCalendarId: connection.personalCalendarGoogleId,
        name: `${churchName} - Prywatny`,
        description: 'Twoje osobiste służby i spotkania',
        syncEnabled: connection.syncPersonalCalendar,
      })
    }

    const response: GoogleCalendarConnectionResponse = {
      connection,
      calendars,
      availableCampuses,
      canSyncChurchCalendar: isAdmin,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Google Calendar status error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
