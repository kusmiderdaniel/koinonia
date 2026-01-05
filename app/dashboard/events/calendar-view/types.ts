import type { Event } from '../types'

export interface CalendarViewProps {
  events: Event[]
  firstDayOfWeek?: number // 0 = Sunday, 1 = Monday (default)
  onEventSelect?: (event: Event) => void
  leftPanelContent?: React.ReactNode
}

export const CALENDAR_EVENT_COLORS: Record<string, string> = {
  service: 'bg-blue-500',
  rehearsal: 'bg-purple-500',
  meeting: 'bg-green-500',
  special_event: 'bg-amber-500',
  other: 'bg-gray-500',
}

export const DAYS_SUNDAY_START = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
]

export const DAYS_MONDAY_START = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
]

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const STATUS_BADGES: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  draft: { variant: 'secondary', label: 'Draft' },
  published: { variant: 'default', label: 'Published' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
}
