/**
 * Sync Service for Google Calendar Integration
 *
 * Handles synchronization of Koinonia events to Google Calendar.
 * Called when events are created, updated, or deleted.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAuthenticatedClient, updateLastSync } from './token-manager'
import {
  mapEventToGoogleFormat,
  generateKoinoniaEventHash,
  shouldSyncToChurchCalendar,
  shouldSyncToCampusCalendar,
  shouldSyncToPersonalCalendar,
  toGoogleCalendarRequestBody,
  type KoinoniaEvent,
  type EventAssignment,
} from './event-mapper'
import type { CalendarType, GoogleCalendarConnection } from './types'

// ============================================
// Types
// ============================================

interface SyncResult {
  success: boolean
  synced: number
  errors: string[]
}

interface ConnectionWithCalendars {
  connection: GoogleCalendarConnection
  churchCalendarId: string | null
  personalCalendarId: string | null
  campusCalendars: {
    campusId: string
    googleCalendarId: string
    syncEnabled: boolean
  }[]
}

// ============================================
// Main Sync Functions
// ============================================

/**
 * Sync a single event to all applicable Google Calendars.
 * Called after event create/update.
 */
export async function syncEventToGoogle(eventId: string): Promise<SyncResult> {
  const errors: string[] = []
  let synced = 0

  // Fetch the event with all related data
  const event = await fetchEventWithDetails(eventId)
  if (!event) {
    return { success: false, synced: 0, errors: ['Event not found'] }
  }

  // Get all active connections for this church
  const connections = await getActiveConnectionsForChurch(event.church_id)

  for (const conn of connections) {
    try {
      const result = await syncEventForConnection(event, conn)
      synced += result.synced
      errors.push(...result.errors)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Connection ${conn.connection.id}: ${msg}`)
    }
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
  }
}

/**
 * Delete an event from all Google Calendars.
 * Called before event deletion in Koinonia.
 */
export async function deleteEventFromGoogle(eventId: string): Promise<SyncResult> {
  const supabase = createServiceRoleClient()
  const errors: string[] = []
  let synced = 0

  // Get all synced events for this Koinonia event
  const { data: syncedEvents, error: fetchError } = await supabase
    .from('google_calendar_synced_events')
    .select('*, connection:google_calendar_connections(*)')
    .eq('event_id', eventId)

  if (fetchError) {
    return { success: false, synced: 0, errors: [fetchError.message] }
  }

  if (!syncedEvents || syncedEvents.length === 0) {
    // No synced events to delete
    return { success: true, synced: 0, errors: [] }
  }

  // Delete from each Google Calendar
  for (const syncedEvent of syncedEvents) {
    try {
      const { calendar } = await getAuthenticatedClient(syncedEvent.connection_id)

      await calendar.events.delete({
        calendarId: syncedEvent.google_calendar_id,
        eventId: syncedEvent.google_event_id,
      })

      // Delete the sync record
      await supabase
        .from('google_calendar_synced_events')
        .delete()
        .eq('id', syncedEvent.id)

      synced++
    } catch (error) {
      // If the event doesn't exist in Google, just delete the sync record
      if ((error as { code?: number })?.code === 404) {
        await supabase
          .from('google_calendar_synced_events')
          .delete()
          .eq('id', syncedEvent.id)
        synced++
        continue
      }

      const msg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to delete from ${syncedEvent.google_calendar_id}: ${msg}`)
    }
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
  }
}

// ============================================
// Per-Connection Sync
// ============================================

/**
 * Sync an event for a specific connection.
 */
async function syncEventForConnection(
  event: KoinoniaEvent & { church_id: string },
  conn: ConnectionWithCalendars
): Promise<SyncResult> {
  const errors: string[] = []
  let synced = 0

  // Get user's assignments for personal calendar
  const assignments = await getUserAssignmentsForEvent(
    event.id,
    conn.connection.profileId
  )

  // 1. Sync to church calendar
  if (conn.connection.syncChurchCalendar && conn.churchCalendarId) {
    if (shouldSyncToChurchCalendar(event)) {
      try {
        await syncEventToCalendar(
          event,
          conn.connection.id,
          conn.churchCalendarId,
          'church',
          null,
          undefined
        )
        synced++
      } catch (error) {
        errors.push(`Church calendar: ${(error as Error).message}`)
      }
    } else {
      // Remove from church calendar if it was previously synced
      await removeSyncedEventIfExists(
        event.id,
        conn.connection.id,
        'church',
        null
      )
    }
  }

  // 2. Sync to campus calendars
  for (const campusCalendar of conn.campusCalendars) {
    if (!campusCalendar.syncEnabled) continue

    if (shouldSyncToCampusCalendar(event, campusCalendar.campusId)) {
      try {
        await syncEventToCalendar(
          event,
          conn.connection.id,
          campusCalendar.googleCalendarId,
          'campus',
          campusCalendar.campusId,
          undefined
        )
        synced++
      } catch (error) {
        errors.push(`Campus ${campusCalendar.campusId}: ${(error as Error).message}`)
      }
    } else {
      await removeSyncedEventIfExists(
        event.id,
        conn.connection.id,
        'campus',
        campusCalendar.campusId
      )
    }
  }

  // 3. Sync to personal calendar
  if (conn.connection.syncPersonalCalendar && conn.personalCalendarId) {
    const hasAssignment = assignments.length > 0

    // For hidden events, also check if user is directly invited via event_invitations
    const isHiddenEvent = event.visibility === 'hidden'
    const isInvitedToHidden = isHiddenEvent
      ? await isUserInvitedToHiddenEvent(event.id, conn.connection.profileId)
      : false

    if (shouldSyncToPersonalCalendar(event, hasAssignment) || isInvitedToHidden) {
      try {
        // For hidden event invitations without assignments, pass a placeholder
        const assignmentsOrInvitation = hasAssignment
          ? assignments
          : isInvitedToHidden
            ? [{ position_name: 'Invited', position_description: null }]
            : undefined

        await syncEventToCalendar(
          event,
          conn.connection.id,
          conn.personalCalendarId,
          'personal',
          null,
          assignmentsOrInvitation
        )
        synced++
      } catch (error) {
        errors.push(`Personal calendar: ${(error as Error).message}`)
      }
    } else {
      await removeSyncedEventIfExists(
        event.id,
        conn.connection.id,
        'personal',
        null
      )
    }
  }

  return { success: errors.length === 0, synced, errors }
}

// ============================================
// Calendar Sync Operations
// ============================================

/**
 * Sync a single event to a specific Google Calendar.
 */
async function syncEventToCalendar(
  event: KoinoniaEvent,
  connectionId: string,
  googleCalendarId: string,
  calendarType: CalendarType,
  campusId: string | null,
  userAssignments?: EventAssignment[]
): Promise<void> {
  const supabase = createServiceRoleClient()
  const { calendar } = await getAuthenticatedClient(connectionId)

  // Map the event to Google Calendar format
  const mappedEvent = mapEventToGoogleFormat(event, calendarType, {
    userAssignments,
  })
  const requestBody = toGoogleCalendarRequestBody(mappedEvent)

  // Calculate hash for change detection
  // For personal calendars, include assignments so hash changes when roles change
  const eventHash = generateKoinoniaEventHash(
    event,
    calendarType === 'personal' ? userAssignments : undefined
  )

  // Check if we already have a synced event record
  let existingSyncQuery = supabase
    .from('google_calendar_synced_events')
    .select('*')
    .eq('event_id', event.id)
    .eq('connection_id', connectionId)
    .eq('calendar_type', calendarType)

  // Handle null campus_id correctly (NULL = NULL returns NULL in SQL, not TRUE)
  if (campusId) {
    existingSyncQuery = existingSyncQuery.eq('campus_id', campusId)
  } else {
    existingSyncQuery = existingSyncQuery.is('campus_id', null)
  }

  const { data: existingSync } = await existingSyncQuery.single()

  if (existingSync) {
    // Check if event has changed
    if (existingSync.event_hash === eventHash) {
      // No changes in Koinonia, but verify the event still exists in Google Calendar
      // This handles the case where user deleted the event directly in Google Calendar
      try {
        const getResponse = await calendar.events.get({
          calendarId: googleCalendarId,
          eventId: existingSync.google_event_id,
        })

        // Check if event was soft-deleted (status: 'cancelled')
        if (getResponse.data.status === 'cancelled') {
          console.log(`Event ${existingSync.google_event_id} was cancelled in Google Calendar, recreating...`)
          // Fall through to recreate
        } else {
          // Event exists and is active, nothing to do
          return
        }
      } catch (error) {
        const gaxiosError = error as { code?: number; response?: { status?: number } }
        const errorCode = gaxiosError.code
        const errorStatus = gaxiosError.response?.status

        if (errorCode !== 404 && errorStatus !== 404) {
          // For other errors, just return (don't fail the sync)
          console.warn(`Failed to verify event ${existingSync.google_event_id} exists:`, error)
          return
        }

        console.log(`Event ${existingSync.google_event_id} not found in Google Calendar, recreating...`)
        // Fall through to recreate
      }

      // Recreate the event (either 404 or cancelled)
      // Delete the stale sync record
      await supabase
        .from('google_calendar_synced_events')
        .delete()
        .eq('id', existingSync.id)

      // Create new event in Google Calendar
      const response = await calendar.events.insert({
        calendarId: googleCalendarId,
        requestBody,
      })

      const googleEventId = response.data.id
      if (!googleEventId) {
        throw new Error('Google did not return an event ID')
      }

      // Create new sync record
      await supabase.from('google_calendar_synced_events').insert({
        event_id: event.id,
        connection_id: connectionId,
        calendar_type: calendarType,
        campus_id: campusId,
        google_calendar_id: googleCalendarId,
        google_event_id: googleEventId,
        event_hash: eventHash,
        last_synced_at: new Date().toISOString(),
      })
      return
    }

    // Try to update existing event
    try {
      await calendar.events.update({
        calendarId: googleCalendarId,
        eventId: existingSync.google_event_id,
        requestBody,
      })

      // Update sync record
      await supabase
        .from('google_calendar_synced_events')
        .update({
          event_hash: eventHash,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', existingSync.id)
    } catch (error) {
      // If event was deleted in Google Calendar (404), recreate it
      const gaxiosError = error as { code?: number; response?: { status?: number } }
      const errorCode = gaxiosError.code
      const errorStatus = gaxiosError.response?.status

      if (errorCode === 404 || errorStatus === 404) {
        console.log(`Event ${existingSync.google_event_id} not found during update, recreating...`)

        // Delete the stale sync record
        await supabase
          .from('google_calendar_synced_events')
          .delete()
          .eq('id', existingSync.id)

        // Create new event in Google Calendar
        const response = await calendar.events.insert({
          calendarId: googleCalendarId,
          requestBody,
        })

        const googleEventId = response.data.id
        if (!googleEventId) {
          throw new Error('Google did not return an event ID')
        }

        // Create new sync record
        await supabase.from('google_calendar_synced_events').insert({
          event_id: event.id,
          connection_id: connectionId,
          calendar_type: calendarType,
          campus_id: campusId,
          google_calendar_id: googleCalendarId,
          google_event_id: googleEventId,
          event_hash: eventHash,
          last_synced_at: new Date().toISOString(),
        })
      } else {
        // Re-throw other errors
        throw error
      }
    }
  } else {
    // Create new event
    const response = await calendar.events.insert({
      calendarId: googleCalendarId,
      requestBody,
    })

    const googleEventId = response.data.id
    if (!googleEventId) {
      throw new Error('Google did not return an event ID')
    }

    // Create sync record
    await supabase.from('google_calendar_synced_events').insert({
      event_id: event.id,
      connection_id: connectionId,
      calendar_type: calendarType,
      campus_id: campusId,
      google_calendar_id: googleCalendarId,
      google_event_id: googleEventId,
      event_hash: eventHash,
      last_synced_at: new Date().toISOString(),
    })
  }
}

/**
 * Remove a synced event from Google Calendar if it exists.
 */
async function removeSyncedEventIfExists(
  eventId: string,
  connectionId: string,
  calendarType: CalendarType,
  campusId: string | null
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Find the sync record
  let query = supabase
    .from('google_calendar_synced_events')
    .select('*')
    .eq('event_id', eventId)
    .eq('connection_id', connectionId)
    .eq('calendar_type', calendarType)

  if (campusId) {
    query = query.eq('campus_id', campusId)
  } else {
    query = query.is('campus_id', null)
  }

  const { data: syncedEvent } = await query.single()

  if (!syncedEvent) return

  try {
    const { calendar } = await getAuthenticatedClient(connectionId)

    await calendar.events.delete({
      calendarId: syncedEvent.google_calendar_id,
      eventId: syncedEvent.google_event_id,
    })
  } catch (error) {
    // If deletion fails, still remove the sync record
    if ((error as { code?: number })?.code !== 404) {
      console.warn('Failed to delete Google event:', error)
    }
  }

  // Delete the sync record
  await supabase
    .from('google_calendar_synced_events')
    .delete()
    .eq('id', syncedEvent.id)
}

// ============================================
// Data Fetching Helpers
// ============================================

/**
 * Fetch an event with all related data needed for sync.
 */
async function fetchEventWithDetails(
  eventId: string
): Promise<(KoinoniaEvent & { church_id: string }) | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      church_id,
      title,
      description,
      start_time,
      end_time,
      is_all_day,
      status,
      visibility,
      event_type,
      location:locations (name, address),
      event_campuses (campus:campuses (id, name))
    `)
    .eq('id', eventId)
    .single()

  if (error || !data) return null

  // Transform the data - handle Supabase returning arrays for single relations
  const locationData = Array.isArray(data.location) ? data.location[0] : data.location

  return {
    id: data.id,
    church_id: data.church_id,
    title: data.title,
    description: data.description,
    start_time: data.start_time,
    end_time: data.end_time,
    is_all_day: data.is_all_day || false,
    status: data.status,
    visibility: data.visibility,
    event_type: data.event_type,
    location: locationData ? { name: locationData.name, address: locationData.address } : null,
    campuses: (data.event_campuses || [])
      .map((ec: { campus: unknown }) => {
        const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
        if (!campus || typeof campus !== 'object') return null
        const c = campus as { id: string; name: string }
        return { id: c.id, name: c.name }
      })
      .filter((c): c is { id: string; name: string } => c !== null),
  }
}

/**
 * Get all active Google Calendar connections for a church.
 */
async function getActiveConnectionsForChurch(
  churchId: string
): Promise<ConnectionWithCalendars[]> {
  const supabase = createServiceRoleClient()

  // Get active connections
  const { data: connections, error } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('church_id', churchId)
    .eq('is_active', true)
    .eq('requires_reauth', false)

  if (error || !connections) return []

  // Get campus calendars for each connection
  const result: ConnectionWithCalendars[] = []

  for (const conn of connections) {
    const { data: campusCalendars } = await supabase
      .from('google_calendar_campus_calendars')
      .select('campus_id, google_calendar_id, sync_enabled')
      .eq('connection_id', conn.id)

    result.push({
      connection: {
        id: conn.id,
        profileId: conn.profile_id,
        churchId: conn.church_id,
        googleEmail: conn.google_email,
        googleUserId: conn.google_user_id,
        status: conn.requires_reauth
          ? 'requires_reauth'
          : conn.is_active
            ? 'connected'
            : 'error',
        isActive: conn.is_active,
        lastSyncAt: conn.last_sync_at ? new Date(conn.last_sync_at) : null,
        lastSyncError: conn.last_sync_error,
        requiresReauth: conn.requires_reauth,
        createdAt: new Date(conn.created_at),
        updatedAt: new Date(conn.updated_at),
        churchCalendarGoogleId: conn.church_calendar_google_id,
        personalCalendarGoogleId: conn.personal_calendar_google_id,
        syncChurchCalendar: conn.sync_church_calendar,
        syncPersonalCalendar: conn.sync_personal_calendar,
      },
      churchCalendarId: conn.church_calendar_google_id,
      personalCalendarId: conn.personal_calendar_google_id,
      campusCalendars: (campusCalendars || []).map(cc => ({
        campusId: cc.campus_id,
        googleCalendarId: cc.google_calendar_id,
        syncEnabled: cc.sync_enabled,
      })),
    })
  }

  return result
}

/**
 * Get user's assignments for an event.
 */
async function getUserAssignmentsForEvent(
  eventId: string,
  profileId: string
): Promise<EventAssignment[]> {
  const supabase = createServiceRoleClient()

  // First get the event position IDs for this event
  const { data: positions } = await supabase
    .from('event_positions')
    .select('id')
    .eq('event_id', eventId)

  if (!positions || positions.length === 0) return []

  const positionIds = positions.map(p => p.id)

  // Then get the user's assignments for these positions
  // Include both 'accepted' and 'invited' so users see events they need to respond to
  const { data, error } = await supabase
    .from('event_assignments')
    .select(`
      event_position:event_positions (
        title,
        notes
      )
    `)
    .eq('profile_id', profileId)
    .in('status', ['accepted', 'invited'])
    .in('position_id', positionIds)

  if (error || !data) return []

  // Handle both array and single object return types from Supabase
  return data
    .map((a) => {
      const position = Array.isArray(a.event_position)
        ? a.event_position[0]
        : a.event_position
      if (!position) return null
      return {
        position_name: position.title,
        position_description: position.notes,
      }
    })
    .filter((item): item is EventAssignment => item !== null)
}

/**
 * Check if user is invited to a hidden event (via event_invitations table).
 */
async function isUserInvitedToHiddenEvent(
  eventId: string,
  profileId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('event_invitations')
    .select('id')
    .eq('event_id', eventId)
    .eq('profile_id', profileId)
    .single()

  return !error && !!data
}

// ============================================
// Batch Sync Operations
// ============================================

/**
 * Sync all events for a connection.
 * Used for initial sync or full re-sync.
 */
export async function syncAllEventsForConnection(
  connectionId: string
): Promise<SyncResult> {
  const supabase = createServiceRoleClient()
  const errors: string[] = []
  let synced = 0

  // Get connection details
  const { data: connection, error: connError } = await supabase
    .from('google_calendar_connections')
    .select('church_id')
    .eq('id', connectionId)
    .single()

  if (connError || !connection) {
    return { success: false, synced: 0, errors: ['Connection not found'] }
  }

  // Get all published events for the church
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id')
    .eq('church_id', connection.church_id)
    .eq('status', 'published')

  if (eventsError || !events) {
    return { success: false, synced: 0, errors: [eventsError?.message || 'Failed to fetch events'] }
  }

  // Sync each event
  for (const event of events) {
    try {
      const result = await syncEventToGoogle(event.id)
      synced += result.synced
      errors.push(...result.errors)
    } catch (error) {
      errors.push(`Event ${event.id}: ${(error as Error).message}`)
    }
  }

  // Update the last sync timestamp
  try {
    await updateLastSync(connectionId)
  } catch (error) {
    console.error('Failed to update last sync timestamp:', error)
  }

  return { success: errors.length === 0, synced, errors }
}
