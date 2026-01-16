/**
 * Event Mapper for Google Calendar Integration
 *
 * Transforms Koinonia events to Google Calendar event format.
 */

import type { calendar_v3 } from 'googleapis'
import {
  formatGoogleDateTime,
  buildLocationString,
  generateEventHash,
  buildEventLink,
} from './utils'
import type { CalendarType } from './types'

// ============================================
// Types
// ============================================

export interface KoinoniaEvent {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  is_all_day: boolean
  status: string
  visibility: string
  event_type: string
  location?: {
    name: string
    address: string | null
  } | null
  campuses?: {
    id: string
    name: string
  }[]
}

export interface EventAssignment {
  position_name: string
  position_description: string | null
}

export interface MappedGoogleEvent {
  summary: string
  description?: string
  location?: string
  start: { date: string } | { dateTime: string; timeZone: string }
  end: { date: string } | { dateTime: string; timeZone: string }
  status: 'confirmed' | 'tentative' | 'cancelled'
  transparency: 'opaque' | 'transparent'
}

// ============================================
// Event Mapping
// ============================================

/**
 * Map a Koinonia event to Google Calendar event format.
 */
export function mapEventToGoogleFormat(
  event: KoinoniaEvent,
  calendarType: CalendarType,
  options?: {
    userAssignments?: EventAssignment[]
    churchName?: string
  }
): MappedGoogleEvent {
  const locationString = buildLocationString(
    event.location?.name || null,
    event.location?.address || null
  )

  // Build description based on calendar type
  const description = buildEventDescription(event, calendarType, options)

  // Map status
  const status = mapEventStatus(event.status)

  return {
    summary: event.title,
    description,
    location: locationString,
    start: formatGoogleDateTime(event.start_time, event.is_all_day || false),
    end: formatGoogleDateTime(event.end_time, event.is_all_day || false),
    status,
    transparency: 'opaque', // Show as busy
  }
}

/**
 * Build the event description based on calendar type.
 * - Church/Campus: description + location
 * - Personal: description + location + user's assigned roles
 */
function buildEventDescription(
  event: KoinoniaEvent,
  calendarType: CalendarType,
  options?: {
    userAssignments?: EventAssignment[]
    churchName?: string
  }
): string | undefined {
  const parts: string[] = []

  // Add event description
  if (event.description) {
    parts.push(event.description)
  }

  // For personal calendar, add user's assignments
  if (calendarType === 'personal' && options?.userAssignments && options.userAssignments.length > 0) {
    parts.push('')
    parts.push('Twoje role:')
    for (const assignment of options.userAssignments) {
      parts.push(`• ${assignment.position_name}`)
    }
  }

  // Add campus info for church calendar
  if (calendarType === 'church' && event.campuses && event.campuses.length > 0) {
    parts.push('')
    parts.push(`Campus: ${event.campuses.map(c => c.name).join(', ')}`)
  }

  // Add link to Koinonia and read-only notice
  parts.push('')
  parts.push(`Zobacz w Koinonia: ${buildEventLink(event.id)}`)
  parts.push('')
  parts.push('⚠️ Ten kalendarz jest tylko do odczytu. Zmiany wprowadzone tutaj nie zostaną zsynchronizowane z Koinonia.')

  return parts.length > 0 ? parts.join('\n') : undefined
}

/**
 * Map Koinonia event status to Google Calendar status.
 */
function mapEventStatus(status: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (status) {
    case 'published':
      return 'confirmed'
    case 'draft':
      return 'tentative'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'confirmed'
  }
}

// ============================================
// Change Detection
// ============================================

/**
 * Generate a hash for an event to detect changes.
 * For personal calendars, include assignment role names to detect when roles change.
 */
export function generateKoinoniaEventHash(
  event: KoinoniaEvent,
  assignments?: EventAssignment[]
): string {
  return generateEventHash({
    title: event.title,
    description: event.description,
    startTime: event.start_time,
    endTime: event.end_time,
    isAllDay: event.is_all_day || false,
    location: buildLocationString(
      event.location?.name || null,
      event.location?.address || null
    ) || null,
    assignments: assignments?.map(a => a.position_name),
  })
}

// ============================================
// Visibility Helpers
// ============================================

/**
 * Check if an event should be synced to the church (public) calendar.
 * Only published events with 'members' visibility (public).
 */
export function shouldSyncToChurchCalendar(event: KoinoniaEvent): boolean {
  return event.status === 'published' && event.visibility === 'members'
}

/**
 * Check if an event should be synced to a specific campus calendar.
 * Event must be published, public (members visibility), and belong to the campus.
 */
export function shouldSyncToCampusCalendar(
  event: KoinoniaEvent,
  campusId: string
): boolean {
  if (event.status !== 'published') {
    return false
  }

  // Campus calendars only sync public events (visibility = 'members')
  if (event.visibility !== 'members') {
    return false
  }

  // Check if event belongs to this campus
  return event.campuses?.some(c => c.id === campusId) || false
}

/**
 * Check if an event should be synced to a user's personal calendar.
 * Event must be published and user must have an assignment.
 */
export function shouldSyncToPersonalCalendar(
  event: KoinoniaEvent,
  hasAssignment: boolean
): boolean {
  return event.status === 'published' && hasAssignment
}

// ============================================
// Convert Google API Event to Update Body
// ============================================

/**
 * Convert MappedGoogleEvent to Google Calendar API request body.
 */
export function toGoogleCalendarRequestBody(
  mapped: MappedGoogleEvent
): calendar_v3.Schema$Event {
  return {
    summary: mapped.summary,
    description: mapped.description,
    location: mapped.location,
    start: mapped.start,
    end: mapped.end,
    status: mapped.status,
    transparency: mapped.transparency,
  }
}
