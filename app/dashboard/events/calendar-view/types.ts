import type { Event } from '../types'

export interface CalendarViewProps {
  events: Event[]
  firstDayOfWeek?: number // 0 = Sunday, 1 = Monday (default)
  timeFormat?: '12h' | '24h'
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

export const DAYS_SUNDAY_START_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export const DAYS_MONDAY_START_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const

export const STATUS_BADGES: Record<
  string,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
> = {
  draft: { variant: 'secondary', label: 'Draft' },
  published: { variant: 'default', label: 'Published' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
}
