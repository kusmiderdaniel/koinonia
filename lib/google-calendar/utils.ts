/**
 * Utility functions for Google Calendar Integration
 */

import { createHash } from 'crypto'

/**
 * Generate a hash of event data for change detection.
 * Used to determine if an event needs to be updated in Google Calendar.
 * For personal calendars, include assignments to detect role changes.
 */
export function generateEventHash(eventData: {
  title: string
  description: string | null
  startTime: string
  endTime: string
  isAllDay: boolean
  location: string | null
  assignments?: string[] // Role names for personal calendar hash
}): string {
  const normalized = JSON.stringify({
    t: eventData.title,
    d: eventData.description || '',
    s: eventData.startTime,
    e: eventData.endTime,
    a: eventData.isAllDay,
    l: eventData.location || '',
    r: eventData.assignments?.sort() || [], // Include sorted role names
  })

  return createHash('sha256').update(normalized).digest('hex').substring(0, 16)
}

/**
 * Format a date for Google Calendar API.
 * Handles both all-day events and timed events.
 */
export function formatGoogleDateTime(
  dateString: string,
  isAllDay: boolean
): { date: string } | { dateTime: string; timeZone: string } {
  const date = new Date(dateString)

  if (isAllDay) {
    // All-day events use date only (YYYY-MM-DD)
    return {
      date: date.toISOString().split('T')[0],
    }
  }

  // Timed events use dateTime with timezone
  return {
    dateTime: date.toISOString(),
    timeZone: 'Europe/Warsaw', // Default timezone for Polish church app
  }
}

/**
 * Build the location string for Google Calendar.
 */
export function buildLocationString(
  locationName: string | null,
  locationAddress: string | null
): string | undefined {
  if (!locationName && !locationAddress) {
    return undefined
  }

  const parts = [locationName, locationAddress].filter(Boolean)
  return parts.join(', ')
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Build a link to the event in Koinonia app.
 */
export function buildEventLink(eventId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}/dashboard/events/${eventId}`
}
