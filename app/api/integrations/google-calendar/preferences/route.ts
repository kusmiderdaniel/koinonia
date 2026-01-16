/**
 * Google Calendar Preferences Endpoint
 *
 * PATCH /api/integrations/google-calendar/preferences
 *
 * Updates the user's Google Calendar sync preferences:
 * - Toggle church calendar sync
 * - Toggle personal calendar sync
 * - Toggle campus calendar sync (creates/enables individual campus calendars)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getConnectionByProfileId, updateConnectionPreferences } from '@/lib/google-calendar/token-manager'
import {
  createChurchCalendar,
  createPersonalCalendar,
  toggleCampusCalendarSync,
} from '@/lib/google-calendar/calendar-manager'

export const dynamic = 'force-dynamic'

interface PreferencesBody {
  syncChurchCalendar?: boolean
  syncPersonalCalendar?: boolean
  campusPreferences?: {
    campusId: string
    enabled: boolean
  }[]
}

export async function PATCH(request: NextRequest) {
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

    // Check if user is admin or higher
    const isAdmin = profile.role === 'admin' || profile.role === 'owner'

    // Get user's campus memberships (for non-admins)
    const { data: userCampuses } = await adminClient
      .from('profile_campuses')
      .select('campus_id')
      .eq('profile_id', profile.id)

    const userCampusIds = new Set(userCampuses?.map(uc => uc.campus_id) || [])

    // Parse request body
    let body: PreferencesBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
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

    // Get church name for calendar creation
    const { data: church } = await adminClient
      .from('churches')
      .select('name')
      .eq('id', profile.church_id)
      .single()

    const churchName = church?.name || 'Kościół'

    // Handle church calendar preference (admins only)
    if (body.syncChurchCalendar !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can sync the church-wide calendar' },
          { status: 403 }
        )
      }

      // If enabling and no calendar exists yet, create it
      if (body.syncChurchCalendar && !connection.churchCalendarGoogleId) {
        try {
          await createChurchCalendar(connection.id, churchName)
        } catch (error) {
          console.error('Failed to create church calendar:', error)
          return NextResponse.json(
            { error: 'Failed to create church calendar' },
            { status: 500 }
          )
        }
      }

      await updateConnectionPreferences(connection.id, {
        syncChurchCalendar: body.syncChurchCalendar,
      })
    }

    // Handle personal calendar preference
    if (body.syncPersonalCalendar !== undefined) {
      // If enabling and no calendar exists yet, create it
      if (body.syncPersonalCalendar && !connection.personalCalendarGoogleId) {
        try {
          await createPersonalCalendar(connection.id, churchName)
        } catch (error) {
          console.error('Failed to create personal calendar:', error)
          return NextResponse.json(
            { error: 'Failed to create personal calendar' },
            { status: 500 }
          )
        }
      }

      await updateConnectionPreferences(connection.id, {
        syncPersonalCalendar: body.syncPersonalCalendar,
      })
    }

    // Handle campus calendar preferences
    if (body.campusPreferences && body.campusPreferences.length > 0) {
      // For non-admins, verify they belong to each campus they're trying to sync
      if (!isAdmin) {
        const unauthorizedCampus = body.campusPreferences.find(
          cp => cp.enabled && !userCampusIds.has(cp.campusId)
        )
        if (unauthorizedCampus) {
          return NextResponse.json(
            { error: 'You can only sync calendars for campuses you belong to' },
            { status: 403 }
          )
        }
      }

      // Get campus details for any that need to be created
      const campusIds = body.campusPreferences
        .filter(cp => cp.enabled)
        .map(cp => cp.campusId)

      const { data: campuses } = await adminClient
        .from('campuses')
        .select('id, name, color')
        .in('id', campusIds)

      const campusMap = new Map(
        (campuses || []).map(c => [c.id, { name: c.name, color: c.color }])
      )

      for (const pref of body.campusPreferences) {
        try {
          const campus = campusMap.get(pref.campusId)
          await toggleCampusCalendarSync(
            connection.id,
            pref.campusId,
            pref.enabled,
            churchName,
            campus?.name,
            campus?.color
          )
        } catch (error) {
          console.error(`Failed to toggle campus calendar ${pref.campusId}:`, error)
          // Continue with other campuses
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    })
  } catch (error) {
    console.error('Google Calendar preferences error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
