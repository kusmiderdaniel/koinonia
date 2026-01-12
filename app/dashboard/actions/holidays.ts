'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export interface ChurchHoliday {
  id: string
  name: string
  description: string | null
  date: string // ISO date string (YYYY-MM-DD)
  color: string
  isDefault: boolean
}

/**
 * Get church holidays for a specific month
 * Returns both recurring annual holidays and one-time holidays
 */
export async function getChurchHolidays(
  month: number,
  year: number
): Promise<{ data?: ChurchHoliday[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Calculate month boundaries for one-time holidays
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0) // Last day of month

  // Fetch recurring holidays for this month (by month number)
  const { data: recurringHolidays, error: recurringError } = await adminClient
    .from('church_holidays')
    .select('id, name, description, month, day, color, is_default')
    .eq('church_id', profile.church_id)
    .eq('month', month + 1) // JavaScript months are 0-indexed, DB is 1-indexed
    .is('specific_date', null)

  if (recurringError) {
    console.error('Error fetching recurring holidays:', recurringError)
    return { error: 'Failed to fetch holidays' }
  }

  // Fetch one-time holidays for this month
  const { data: oneTimeHolidays, error: oneTimeError } = await adminClient
    .from('church_holidays')
    .select('id, name, description, specific_date, color, is_default')
    .eq('church_id', profile.church_id)
    .gte('specific_date', monthStart.toISOString().split('T')[0])
    .lte('specific_date', monthEnd.toISOString().split('T')[0])

  if (oneTimeError) {
    console.error('Error fetching one-time holidays:', oneTimeError)
    return { error: 'Failed to fetch holidays' }
  }

  // Transform recurring holidays to include the full date for the current year
  const holidays: ChurchHoliday[] = [
    ...(recurringHolidays || []).map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      date: `${year}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`,
      color: h.color || '#f59e0b',
      isDefault: h.is_default || false,
    })),
    ...(oneTimeHolidays || []).map((h) => ({
      id: h.id,
      name: h.name,
      description: h.description,
      date: h.specific_date!,
      color: h.color || '#f59e0b',
      isDefault: h.is_default || false,
    })),
  ]

  return { data: holidays }
}
