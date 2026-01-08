// Shared formatting utilities

/**
 * Time format type - 12-hour (AM/PM) or 24-hour
 */
export type TimeFormat = '12h' | '24h'

/**
 * Get the date-fns format pattern for time based on preference
 */
export function getTimeFormatPattern(timeFormat: TimeFormat): string {
  return timeFormat === '12h' ? 'h:mm a' : 'HH:mm'
}

/**
 * Get the date-fns format pattern for datetime based on preference
 * Example: "Mon, Dec 23 at 2:30 PM" or "Mon, Dec 23 at 14:30"
 */
export function getDateTimeFormatPattern(timeFormat: TimeFormat): string {
  return timeFormat === '12h' ? "EEE, MMM d 'at' h:mm a" : "EEE, MMM d 'at' HH:mm"
}

/**
 * Get locale options for toLocaleTimeString based on preference
 */
export function getTimeLocaleOptions(timeFormat: TimeFormat): Intl.DateTimeFormatOptions {
  return timeFormat === '12h'
    ? { hour: 'numeric', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit', hour12: false }
}

/**
 * Parse MM:SS string to seconds
 */
export function parseDuration(mmss: string): number | null {
  const match = mmss.match(/^(\d+):(\d{2})$/)
  if (!match) return null
  const minutes = parseInt(match[1], 10)
  const seconds = parseInt(match[2], 10)
  if (seconds >= 60) return null
  return minutes * 60 + seconds
}

/**
 * Format duration in seconds to MM:SS or H:MM:SS
 * Returns empty string if seconds is null/undefined
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format duration in minutes to a readable string
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    if (remainingMins === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMins}m`
  }
  return `${minutes}m`
}

/**
 * Format time string (HH:MM:SS or HH:MM) based on time format preference
 */
export function formatTime(timeString: string, timeFormat: TimeFormat = '24h'): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  if (timeFormat === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Format a Date object to time format based on preference
 */
export function formatTimeFromDate(date: Date, timeFormat: TimeFormat = '24h'): string {
  return date.toLocaleTimeString('en-US', getTimeLocaleOptions(timeFormat))
}

/**
 * Format seconds to MM:SS display
 * Alias: formatDurationShort
 */
export function formatSecondsToMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Alias for formatSecondsToMinutes
export const formatDurationShort = formatSecondsToMinutes

/**
 * Format total seconds to human-readable running time (e.g., "1h 30m" or "45m")
 */
export function formatRunningTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

/**
 * Format total seconds to minutes and seconds strings for form inputs
 */
export function formatDurationInputs(totalSeconds: number): {
  minutes: string
  seconds: string
} {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return {
    minutes: mins.toString(),
    seconds: secs.toString().padStart(2, '0'),
  }
}

/**
 * Format event datetime for display
 */
export function formatEventDateTime(
  startTime: string,
  endTime: string,
  isAllDay: boolean,
  timeFormat: TimeFormat = '24h'
): { date: string; time: string } {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const day = start.getDate().toString().padStart(2, '0')
  const month = (start.getMonth() + 1).toString().padStart(2, '0')
  const year = start.getFullYear()
  const dateStr = `${day}/${month}/${year}`

  if (isAllDay) {
    return { date: dateStr, time: 'All day' }
  }

  const startTimeStr = start.toLocaleTimeString('en-US', getTimeLocaleOptions(timeFormat))
  const endTimeStr = end.toLocaleTimeString('en-US', getTimeLocaleOptions(timeFormat))

  return { date: dateStr, time: `${startTimeStr} - ${endTimeStr}` }
}

/**
 * Format a date for event card display
 */
export function formatEventCardDate(
  startTime: string,
  isAllDay: boolean,
  timeFormat: TimeFormat = '24h'
): { date: string; time: string } {
  const startDate = new Date(startTime)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = isAllDay
    ? 'All day'
    : startDate.toLocaleTimeString('en-US', getTimeLocaleOptions(timeFormat))

  return { date: dateStr, time: timeStr }
}

/**
 * Convert Date to YYYY-MM-DD string
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Format a date range for display (e.g., "Dec 23" or "Dec 23 - Dec 25")
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = parseDateString(start)
  const endDate = parseDateString(end)

  const formatSingle = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (start === end) {
    return formatSingle(startDate)
  }
  return `${formatSingle(startDate)} - ${formatSingle(endDate)}`
}
