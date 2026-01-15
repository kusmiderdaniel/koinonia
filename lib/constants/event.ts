// Shared event constants used across the application

export const EVENT_TYPE_LABELS: Record<string, string> = {
  service: 'Service',
  rehearsal: 'Rehearsal',
  meeting: 'Meeting',
  special_event: 'Special Event',
  other: 'Other',
}

export const EVENT_TYPE_COLORS: Record<string, string> = {
  service: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  rehearsal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  meeting: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  special_event: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export const VISIBILITY_STYLES: Record<string, string> = {
  members: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  volunteers: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  leaders: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  hidden: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
}

// Musical keys for songs (major and minor)
export const MUSICAL_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F',
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm',
  'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bbm', 'Bm',
] as const

export type MusicalKey = typeof MUSICAL_KEYS[number]
