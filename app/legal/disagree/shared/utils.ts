import { format, formatDistanceToNow } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'

export function getDateFnsLocale(language: 'en' | 'pl') {
  return language === 'pl' ? pl : enUS
}

export function formatFullDate(date: Date | string, language: 'en' | 'pl') {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'PPPP', { locale: getDateFnsLocale(language) })
}

export function formatShortDate(date: Date | string, language: 'en' | 'pl') {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'PPP', { locale: getDateFnsLocale(language) })
}

export function formatRelativeTime(date: Date | string, language: 'en' | 'pl') {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: getDateFnsLocale(language) })
}

export function getDocumentUrl(documentType: string) {
  return `/legal/${documentType.replace(/_/g, '-')}`
}
