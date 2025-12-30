// Shared formatting utilities

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
 * Format time string (HH:MM:SS or HH:MM) to 12-hour format
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Alias for formatTime for backwards compatibility
export const formatTimeString = formatTime

/**
 * Format a Date object to 12-hour time format
 */
export function formatTimeFromDate(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/**
 * Format seconds to MM:SS display
 */
export function formatSecondsToMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format event datetime for display
 */
export function formatEventDateTime(
  startTime: string,
  endTime: string,
  isAllDay: boolean
): { date: string; time: string } {
  const start = new Date(startTime)
  const end = new Date(endTime)

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  }

  const dateStr = start.toLocaleDateString('en-US', dateOptions)

  if (isAllDay) {
    return { date: dateStr, time: 'All day' }
  }

  const startTimeStr = start.toLocaleTimeString('en-US', timeOptions)
  const endTimeStr = end.toLocaleTimeString('en-US', timeOptions)

  return { date: dateStr, time: `${startTimeStr} - ${endTimeStr}` }
}

/**
 * Format a date for event card display
 */
export function formatEventCardDate(startTime: string, isAllDay: boolean): { date: string; time: string } {
  const startDate = new Date(startTime)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = isAllDay
    ? 'All day'
    : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return { date: dateStr, time: timeStr }
}
