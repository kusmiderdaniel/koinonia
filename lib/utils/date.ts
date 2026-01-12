/**
 * Date utility functions for consistent date handling across the codebase.
 *
 * These utilities handle common date operations like converting to date strings
 * and parsing ISO date strings.
 */

/**
 * Convert a Date object or ISO string to a YYYY-MM-DD date string.
 *
 * @example
 * toDateString(new Date()) // "2024-01-15"
 * toDateString("2024-01-15T10:30:00Z") // "2024-01-15"
 *
 * @param date - A Date object or ISO date string
 * @returns A string in YYYY-MM-DD format
 */
export function toDateString(date: Date | string): string {
  if (typeof date === 'string') {
    return date.split('T')[0]
  }
  return date.toISOString().split('T')[0]
}

/**
 * Get today's date as a YYYY-MM-DD string.
 *
 * @example
 * getTodayString() // "2024-01-15"
 *
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Parse an ISO date string into a Date object.
 * Handles date-only strings by treating them as midnight local time.
 *
 * @example
 * parseISODate("2024-01-15") // Date object for Jan 15, 2024 00:00:00 local time
 * parseISODate("2024-01-15T10:30:00Z") // Date object preserving full timestamp
 *
 * @param dateString - An ISO date string (with or without time)
 * @returns A Date object
 */
export function parseISODate(dateString: string): Date {
  // If it's just a date (YYYY-MM-DD), treat as local midnight
  if (dateString.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString + 'T00:00:00')
  }
  return new Date(dateString)
}

/**
 * Compare two dates (ignoring time component).
 *
 * @example
 * compareDates(new Date('2024-01-15'), new Date('2024-01-16')) // -1 (first is earlier)
 * compareDates(new Date('2024-01-15'), new Date('2024-01-15')) // 0 (same day)
 * compareDates(new Date('2024-01-16'), new Date('2024-01-15')) // 1 (first is later)
 *
 * @param a - First date
 * @param b - Second date
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareDates(a: Date | string, b: Date | string): -1 | 0 | 1 {
  const dateA = toDateString(a)
  const dateB = toDateString(b)
  if (dateA < dateB) return -1
  if (dateA > dateB) return 1
  return 0
}

/**
 * Check if two dates are the same day.
 *
 * @example
 * isSameDay(new Date('2024-01-15T10:00:00'), new Date('2024-01-15T15:00:00')) // true
 * isSameDay(new Date('2024-01-15'), new Date('2024-01-16')) // false
 *
 * @param a - First date
 * @param b - Second date
 * @returns true if both dates are on the same day
 */
export function isSameDay(a: Date | string, b: Date | string): boolean {
  return toDateString(a) === toDateString(b)
}

/**
 * Check if a date is today.
 *
 * @example
 * isToday(new Date()) // true
 * isToday('2024-01-15') // depends on current date
 *
 * @param date - The date to check
 * @returns true if the date is today
 */
export function isToday(date: Date | string): boolean {
  return toDateString(date) === getTodayString()
}
