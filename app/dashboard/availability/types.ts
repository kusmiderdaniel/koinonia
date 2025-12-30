'use client'

export interface Unavailability {
  id: string
  start_date: string
  end_date: string
  reason: string | null
  created_at: string
}

// Helper to format date to YYYY-MM-DD
export const toDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to parse YYYY-MM-DD to Date
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Get first day of current month
export const getFirstDayOfCurrentMonth = (): Date => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

// Format date for display
export const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export const formatDateRange = (start: string, end: string): string => {
  if (start === end) {
    return formatDate(start)
  }
  return `${formatDate(start)} - ${formatDate(end)}`
}

export const formatDateShort = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

export const isUpcoming = (endDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return endDate >= today
}
