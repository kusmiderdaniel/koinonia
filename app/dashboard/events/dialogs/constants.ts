// Event type values - labels are in translation files
export const EVENT_TYPE_VALUES = ['service', 'rehearsal', 'meeting', 'special_event', 'other'] as const

// Visibility level values - labels are in translation files
export const VISIBILITY_VALUES = ['members', 'volunteers', 'leaders', 'hidden'] as const

/**
 * Format a date string to datetime-local input format
 */
export function formatDateTimeLocal(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Get default start time (next hour from now)
 */
export function getDefaultStartTime(): string {
  const now = new Date()
  now.setHours(now.getHours() + 1, 0, 0, 0)
  return formatDateTimeLocal(now.toISOString())
}

/**
 * Get default end time (3 hours from now)
 */
export function getDefaultEndTime(): string {
  const now = new Date()
  now.setHours(now.getHours() + 3, 0, 0, 0)
  return formatDateTimeLocal(now.toISOString())
}
