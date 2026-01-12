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
  return date.toLocaleTimeString('en-US', {
    hour: timeFormat === '12h' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  })
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
