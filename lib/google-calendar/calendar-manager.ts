/**
 * Calendar Manager for Google Calendar Integration
 *
 * Handles:
 * - Creating calendars in user's Google account
 * - Deleting calendars from user's Google account
 * - Managing campus calendar records
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAuthenticatedClient } from './token-manager'
import { GoogleCalendarError } from './types'
import type { calendar_v3 } from 'googleapis'

// ============================================
// Calendar Creation
// ============================================

interface CreateCalendarParams {
  churchName: string
  calendarType: 'church' | 'campus' | 'personal'
  campusName?: string
  campusColor?: string
}

/**
 * Create a new calendar in user's Google account.
 */
export async function createCalendar(
  connectionId: string,
  params: CreateCalendarParams
): Promise<string> {
  const { calendar } = await getAuthenticatedClient(connectionId)

  // Build calendar name based on type
  let summary: string
  let description: string

  switch (params.calendarType) {
    case 'church':
      summary = `${params.churchName} - Publiczny`
      description = 'Publiczne wydarzenia kościoła'
      break
    case 'campus':
      if (!params.campusName) {
        throw new GoogleCalendarError('Campus name required for campus calendar', 'INVALID_PARAMS')
      }
      summary = `${params.churchName} - ${params.campusName}`
      description = `Wydarzenia campusu ${params.campusName}`
      break
    case 'personal':
      summary = `${params.churchName} - Prywatny`
      description = 'Twoje osobiste służby i spotkania'
      break
    default:
      throw new GoogleCalendarError(`Unknown calendar type: ${params.calendarType}`, 'INVALID_PARAMS')
  }

  // Create the calendar
  const response = await calendar.calendars.insert({
    requestBody: {
      summary,
      description,
      timeZone: 'Europe/Warsaw', // Default timezone for Polish church app
    },
  })

  const calendarId = response.data.id
  if (!calendarId) {
    throw new GoogleCalendarError('Failed to create calendar - no ID returned', 'GOOGLE_API_ERROR')
  }

  // Optionally set calendar color (for campus calendars)
  if (params.campusColor && params.calendarType === 'campus') {
    try {
      await setCalendarColor(calendar, calendarId, params.campusColor)
    } catch (error) {
      // Color setting is optional - log but don't fail
      console.warn('Failed to set calendar color:', error)
    }
  }

  return calendarId
}

/**
 * Set the color of a calendar in the user's calendar list.
 * Google Calendar has a limited palette of colors (24 predefined).
 */
async function setCalendarColor(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  hexColor: string
): Promise<void> {
  // Map hex color to closest Google Calendar color ID
  const colorId = findClosestGoogleColorId(hexColor)

  await calendar.calendarList.patch({
    calendarId,
    requestBody: {
      colorId,
    },
  })
}

/**
 * Find the closest Google Calendar color ID for a given hex color.
 * Google Calendar has 24 predefined colors.
 */
function findClosestGoogleColorId(hexColor: string): string {
  // Google Calendar color palette (approximate hex values)
  const googleColors: Record<string, string> = {
    '1': '#7986cb', // Lavender
    '2': '#33b679', // Sage
    '3': '#8e24aa', // Grape
    '4': '#e67c73', // Flamingo
    '5': '#f6bf26', // Banana
    '6': '#f4511e', // Tangerine
    '7': '#039be5', // Peacock
    '8': '#616161', // Graphite
    '9': '#3f51b5', // Blueberry
    '10': '#0b8043', // Basil
    '11': '#d50000', // Tomato
  }

  // Simple distance calculation (just use first character matching for now)
  const targetHex = hexColor.replace('#', '').toLowerCase()

  let closestId = '9' // Default to Blueberry
  let minDistance = Infinity

  for (const [id, color] of Object.entries(googleColors)) {
    const colorHex = color.replace('#', '').toLowerCase()
    const distance = colorDistance(targetHex, colorHex)
    if (distance < minDistance) {
      minDistance = distance
      closestId = id
    }
  }

  return closestId
}

/**
 * Calculate simple RGB distance between two hex colors.
 */
function colorDistance(hex1: string, hex2: string): number {
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)

  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)

  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  )
}

// ============================================
// Calendar Deletion
// ============================================

/**
 * Delete a calendar from user's Google account.
 */
export async function deleteCalendar(
  connectionId: string,
  googleCalendarId: string
): Promise<void> {
  const { calendar } = await getAuthenticatedClient(connectionId)

  try {
    await calendar.calendars.delete({
      calendarId: googleCalendarId,
    })
  } catch (error) {
    // If calendar doesn't exist, that's fine
    if ((error as { code?: number })?.code === 404) {
      console.log(`Calendar ${googleCalendarId} already deleted or doesn't exist`)
      return
    }
    throw error
  }
}

/**
 * Delete all calendars created by this connection.
 * Used when disconnecting the integration.
 */
export async function deleteAllCalendars(connectionId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  // Get connection with all calendar IDs
  const { data: connection, error: connError } = await supabase
    .from('google_calendar_connections')
    .select('church_calendar_google_id, personal_calendar_google_id')
    .eq('id', connectionId)
    .single()

  if (connError || !connection) {
    throw new GoogleCalendarError('Connection not found', 'CONNECTION_NOT_FOUND', 404)
  }

  // Get campus calendars
  const { data: campusCalendars } = await supabase
    .from('google_calendar_campus_calendars')
    .select('google_calendar_id')
    .eq('connection_id', connectionId)

  // Collect all calendar IDs to delete
  const calendarIdsToDelete: string[] = []

  if (connection.church_calendar_google_id) {
    calendarIdsToDelete.push(connection.church_calendar_google_id)
  }

  if (connection.personal_calendar_google_id) {
    calendarIdsToDelete.push(connection.personal_calendar_google_id)
  }

  for (const cc of campusCalendars || []) {
    if (cc.google_calendar_id) {
      calendarIdsToDelete.push(cc.google_calendar_id)
    }
  }

  // Delete each calendar
  for (const calendarId of calendarIdsToDelete) {
    try {
      await deleteCalendar(connectionId, calendarId)
    } catch (error) {
      console.warn(`Failed to delete calendar ${calendarId}:`, error)
      // Continue with other calendars
    }
  }
}

// ============================================
// Church Calendar Management
// ============================================

/**
 * Create and save church calendar for a connection.
 */
export async function createChurchCalendar(
  connectionId: string,
  churchName: string
): Promise<string> {
  const supabase = createServiceRoleClient()

  // Create calendar in Google
  const googleCalendarId = await createCalendar(connectionId, {
    churchName,
    calendarType: 'church',
  })

  // Save to database
  const { error } = await supabase
    .from('google_calendar_connections')
    .update({
      church_calendar_google_id: googleCalendarId,
    })
    .eq('id', connectionId)

  if (error) {
    // Try to clean up the created calendar
    try {
      await deleteCalendar(connectionId, googleCalendarId)
    } catch {
      // Ignore cleanup errors
    }
    throw new GoogleCalendarError(`Failed to save church calendar: ${error.message}`, 'DB_ERROR')
  }

  return googleCalendarId
}

/**
 * Create and save personal calendar for a connection.
 */
export async function createPersonalCalendar(
  connectionId: string,
  churchName: string
): Promise<string> {
  const supabase = createServiceRoleClient()

  // Create calendar in Google
  const googleCalendarId = await createCalendar(connectionId, {
    churchName,
    calendarType: 'personal',
  })

  // Save to database
  const { error } = await supabase
    .from('google_calendar_connections')
    .update({
      personal_calendar_google_id: googleCalendarId,
    })
    .eq('id', connectionId)

  if (error) {
    // Try to clean up the created calendar
    try {
      await deleteCalendar(connectionId, googleCalendarId)
    } catch {
      // Ignore cleanup errors
    }
    throw new GoogleCalendarError(`Failed to save personal calendar: ${error.message}`, 'DB_ERROR')
  }

  return googleCalendarId
}

// ============================================
// Campus Calendar Management
// ============================================

/**
 * Create and save a campus calendar for a connection.
 */
export async function createCampusCalendar(
  connectionId: string,
  campusId: string,
  churchName: string,
  campusName: string,
  campusColor?: string
): Promise<string> {
  const supabase = createServiceRoleClient()

  // Create calendar in Google
  const googleCalendarId = await createCalendar(connectionId, {
    churchName,
    calendarType: 'campus',
    campusName,
    campusColor,
  })

  // Save to database
  const { error } = await supabase
    .from('google_calendar_campus_calendars')
    .insert({
      connection_id: connectionId,
      campus_id: campusId,
      google_calendar_id: googleCalendarId,
      sync_enabled: true,
    })

  if (error) {
    // Try to clean up the created calendar
    try {
      await deleteCalendar(connectionId, googleCalendarId)
    } catch {
      // Ignore cleanup errors
    }
    throw new GoogleCalendarError(`Failed to save campus calendar: ${error.message}`, 'DB_ERROR')
  }

  return googleCalendarId
}

/**
 * Delete a campus calendar.
 */
export async function deleteCampusCalendar(
  connectionId: string,
  campusId: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  // Get the campus calendar record
  const { data: campusCalendar, error: findError } = await supabase
    .from('google_calendar_campus_calendars')
    .select('google_calendar_id')
    .eq('connection_id', connectionId)
    .eq('campus_id', campusId)
    .single()

  if (findError || !campusCalendar) {
    // No campus calendar exists, nothing to delete
    return
  }

  // Delete from Google
  await deleteCalendar(connectionId, campusCalendar.google_calendar_id)

  // Delete from database
  const { error: deleteError } = await supabase
    .from('google_calendar_campus_calendars')
    .delete()
    .eq('connection_id', connectionId)
    .eq('campus_id', campusId)

  if (deleteError) {
    console.warn('Failed to delete campus calendar record:', deleteError)
  }
}

/**
 * Toggle campus calendar sync.
 */
export async function toggleCampusCalendarSync(
  connectionId: string,
  campusId: string,
  enabled: boolean,
  churchName?: string,
  campusName?: string,
  campusColor?: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  if (enabled) {
    // Check if calendar exists
    const { data: existing } = await supabase
      .from('google_calendar_campus_calendars')
      .select('id')
      .eq('connection_id', connectionId)
      .eq('campus_id', campusId)
      .single()

    if (existing) {
      // Just enable sync
      await supabase
        .from('google_calendar_campus_calendars')
        .update({ sync_enabled: true })
        .eq('connection_id', connectionId)
        .eq('campus_id', campusId)
    } else {
      // Need to create the calendar first
      if (!churchName || !campusName) {
        throw new GoogleCalendarError(
          'Church name and campus name required to create campus calendar',
          'INVALID_PARAMS'
        )
      }
      await createCampusCalendar(connectionId, campusId, churchName, campusName, campusColor)
    }
  } else {
    // Disable sync (but keep the calendar)
    await supabase
      .from('google_calendar_campus_calendars')
      .update({ sync_enabled: false })
      .eq('connection_id', connectionId)
      .eq('campus_id', campusId)
  }
}

// ============================================
// Initial Calendar Setup
// ============================================

/**
 * Set up initial calendars after OAuth connection.
 * Creates church and personal calendars by default.
 */
export async function setupInitialCalendars(
  connectionId: string,
  churchName: string
): Promise<{
  churchCalendarId: string | null
  personalCalendarId: string | null
}> {
  let churchCalendarId: string | null = null
  let personalCalendarId: string | null = null

  // Create church calendar
  try {
    churchCalendarId = await createChurchCalendar(connectionId, churchName)
  } catch (error) {
    console.error('Failed to create church calendar:', error)
    // Continue with personal calendar
  }

  // Create personal calendar
  try {
    personalCalendarId = await createPersonalCalendar(connectionId, churchName)
  } catch (error) {
    console.error('Failed to create personal calendar:', error)
  }

  return { churchCalendarId, personalCalendarId }
}
