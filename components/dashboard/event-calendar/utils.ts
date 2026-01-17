// Calendar utility functions

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOffset(year: number, month: number, firstDayOfWeek: number): number {
  const jsDay = new Date(year, month, 1).getDay()
  return (jsDay - firstDayOfWeek + 7) % 7
}

export function formatTime(dateString: string, timeFormat: '12h' | '24h' = '24h'): string {
  const date = new Date(dateString)
  const hours = date.getHours()
  const minutes = date.getMinutes()

  if (timeFormat === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } else {
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function buildCalendarDays(firstDayOffset: number, daysInMonth: number): (number | null)[] {
  const days: (number | null)[] = []

  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOffset; i++) {
    days.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return days
}
