'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

const unavailabilitySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reason: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
})

type UnavailabilityInput = z.infer<typeof unavailabilitySchema>

export async function getChurchSettings() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get church settings
  const { data: church } = await adminClient
    .from('churches')
    .select('first_day_of_week')
    .eq('id', profile.church_id)
    .single()

  return {
    data: {
      firstDayOfWeek: church?.first_day_of_week ?? 1,
    }
  }
}

export async function getMyUnavailability() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get user's unavailability entries
  const { data: unavailability, error } = await adminClient
    .from('volunteer_unavailability')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('church_id', profile.church_id)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching unavailability:', error)
    return { error: 'Failed to load unavailability' }
  }

  return { data: unavailability }
}

export async function createUnavailability(data: UnavailabilityInput) {
  const validated = unavailabilitySchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: unavailability, error } = await adminClient
    .from('volunteer_unavailability')
    .insert({
      profile_id: profile.id,
      church_id: profile.church_id,
      start_date: validated.data.startDate,
      end_date: validated.data.endDate,
      reason: validated.data.reason || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating unavailability:', error)
    return { error: 'Failed to create unavailability' }
  }

  revalidatePath('/dashboard/availability')
  return { data: unavailability }
}

export async function updateUnavailability(id: string, data: UnavailabilityInput) {
  const validated = unavailabilitySchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify the entry belongs to the user
  const { data: existing } = await adminClient
    .from('volunteer_unavailability')
    .select('profile_id')
    .eq('id', id)
    .single()

  if (!existing || existing.profile_id !== profile.id) {
    return { error: 'You can only edit your own unavailability' }
  }

  const { error } = await adminClient
    .from('volunteer_unavailability')
    .update({
      start_date: validated.data.startDate,
      end_date: validated.data.endDate,
      reason: validated.data.reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating unavailability:', error)
    return { error: 'Failed to update unavailability' }
  }

  revalidatePath('/dashboard/availability')
  return { success: true }
}

export async function deleteUnavailability(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify the entry belongs to the user
  const { data: existing } = await adminClient
    .from('volunteer_unavailability')
    .select('profile_id')
    .eq('id', id)
    .single()

  if (!existing || existing.profile_id !== profile.id) {
    return { error: 'You can only delete your own unavailability' }
  }

  const { error } = await adminClient
    .from('volunteer_unavailability')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting unavailability:', error)
    return { error: 'Failed to delete unavailability' }
  }

  revalidatePath('/dashboard/availability')
  return { success: true }
}

// Get unavailability for specific profiles on a specific date
// Used by volunteer picker to check who is unavailable for an event
export async function getUnavailabilityForDate(date: string, profileIds: string[]) {
  if (profileIds.length === 0) {
    return { data: [] }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Find unavailability entries where the date falls within the range
  const { data: unavailability, error } = await adminClient
    .from('volunteer_unavailability')
    .select('profile_id, reason')
    .eq('church_id', profile.church_id)
    .in('profile_id', profileIds)
    .lte('start_date', date)
    .gte('end_date', date)

  if (error) {
    console.error('Error fetching unavailability for date:', error)
    return { error: 'Failed to check unavailability' }
  }

  return { data: unavailability }
}
