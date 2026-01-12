// Calendar constants

export const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const

export const DAYS_SUNDAY_START_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
export const DAYS_MONDAY_START_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export const EVENT_TYPE_COLORS: Record<string, string> = {
  service: 'bg-blue-500',
  rehearsal: 'bg-purple-500',
  meeting: 'bg-green-500',
  special_event: 'bg-amber-500',
  other: 'bg-gray-500',
  holiday: 'bg-amber-400',
  birthday: 'bg-pink-400',
}

export type MonthKey = typeof MONTH_KEYS[number]
export type DayKey = typeof DAYS_SUNDAY_START_KEYS[number]
