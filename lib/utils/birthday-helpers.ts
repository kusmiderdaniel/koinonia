/**
 * Birthday date comparison utilities
 * Handles comparing birthdays across year boundaries
 */

/**
 * Check if a birthday falls within a date range (ignoring year)
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @param startDaysOffset - Days from today to start range (negative for past)
 * @param endDaysOffset - Days from today to end range (positive for future)
 * @returns true if birthday falls within the range
 */
export function isBirthdayInRange(
  dateOfBirth: string | null,
  startDaysOffset: number,
  endDaysOffset: number
): boolean {
  if (!dateOfBirth) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [, birthMonth, birthDay] = dateOfBirth.split('-').map(Number)

  // Create dates for this year, next year, and last year birthdays
  const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay)
  const nextYearBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay)
  const lastYearBirthday = new Date(today.getFullYear() - 1, birthMonth - 1, birthDay)

  // Calculate range boundaries
  const rangeStart = new Date(today)
  rangeStart.setDate(today.getDate() + startDaysOffset)

  const rangeEnd = new Date(today)
  rangeEnd.setDate(today.getDate() + endDaysOffset)

  // Check if any of the three possible birthdays fall in range
  return [thisYearBirthday, nextYearBirthday, lastYearBirthday].some(
    (bd) => bd >= rangeStart && bd <= rangeEnd
  )
}

/**
 * Get display information for a birthday
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Object with formatted date and days until info
 */
export function getBirthdayDisplay(dateOfBirth: string): {
  monthDay: string
  daysUntil: number
  label: string
} {
  const [, birthMonth, birthDay] = dateOfBirth.split('-').map(Number)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Format month and day
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const monthDay = `${monthNames[birthMonth - 1]} ${birthDay}`

  // Calculate days until (considering year boundary)
  let thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay)
  thisYearBirthday.setHours(0, 0, 0, 0)

  // If birthday already passed this year, check next year for "days until"
  // But we also want to show recent past birthdays
  let daysUntil = Math.round(
    (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  // If birthday is more than 14 days in the past, use next year's date
  if (daysUntil < -14) {
    const nextYearBirthday = new Date(today.getFullYear() + 1, birthMonth - 1, birthDay)
    nextYearBirthday.setHours(0, 0, 0, 0)
    daysUntil = Math.round(
      (nextYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  // Generate human-readable label
  let label: string
  if (daysUntil === 0) {
    label = 'Today'
  } else if (daysUntil === 1) {
    label = 'Tomorrow'
  } else if (daysUntil === -1) {
    label = 'Yesterday'
  } else if (daysUntil > 0) {
    label = `In ${daysUntil} days`
  } else {
    label = `${Math.abs(daysUntil)} days ago`
  }

  return { monthDay, daysUntil, label }
}

/**
 * Sort birthdays by how close they are (upcoming first, then recent past)
 * @param birthdays - Array of objects with dateOfBirth field
 * @returns Sorted array with upcoming birthdays first
 */
export function sortBirthdaysByProximity<T extends { dateOfBirth: string }>(
  birthdays: T[]
): T[] {
  return [...birthdays].sort((a, b) => {
    const aDisplay = getBirthdayDisplay(a.dateOfBirth)
    const bDisplay = getBirthdayDisplay(b.dateOfBirth)

    // Sort by absolute distance from today, with future dates first
    // Upcoming (positive daysUntil) should come before past (negative)
    if (aDisplay.daysUntil >= 0 && bDisplay.daysUntil < 0) return -1
    if (aDisplay.daysUntil < 0 && bDisplay.daysUntil >= 0) return 1

    // Both future or both past - sort by absolute value
    return Math.abs(aDisplay.daysUntil) - Math.abs(bDisplay.daysUntil)
  })
}
