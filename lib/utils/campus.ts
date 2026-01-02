// Campus utility helpers for role-based access control
// Used primarily for leader-level campus filtering

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type AdminClient = SupabaseClient<Database>

/**
 * Get all campus IDs that a user is assigned to
 */
export async function getUserCampusIds(
  profileId: string,
  adminClient: AdminClient
): Promise<string[]> {
  const { data, error } = await adminClient
    .from('profile_campuses')
    .select('campus_id')
    .eq('profile_id', profileId)

  if (error) {
    console.error('Error fetching user campus IDs:', error)
    return []
  }

  return data?.map((pc) => pc.campus_id) ?? []
}

/**
 * Check if a campus ID is in the user's assigned campuses
 * Returns true if campusId is null (accessible to all) or if user has access
 */
export async function isInUserCampus(
  profileId: string,
  campusId: string | null,
  adminClient: AdminClient
): Promise<boolean> {
  // If no campus restriction, accessible to all
  if (!campusId) return true

  const userCampusIds = await getUserCampusIds(profileId, adminClient)
  return userCampusIds.includes(campusId)
}

/**
 * Check if user has access to an event based on its campuses
 * Returns true if event has no campus assignments or user is in one of the event's campuses
 */
export async function hasEventCampusAccess(
  profileId: string,
  eventId: string,
  adminClient: AdminClient
): Promise<boolean> {
  // Get event's campus assignments
  const { data: eventCampuses, error } = await adminClient
    .from('event_campuses')
    .select('campus_id')
    .eq('event_id', eventId)

  if (error) {
    console.error('Error fetching event campuses:', error)
    return false
  }

  // If event has no campus assignments, accessible to all
  if (!eventCampuses || eventCampuses.length === 0) return true

  const userCampusIds = await getUserCampusIds(profileId, adminClient)
  const eventCampusIds = eventCampuses.map((ec) => ec.campus_id)

  // Check if user shares any campus with the event
  return eventCampusIds.some((campusId) => userCampusIds.includes(campusId))
}

/**
 * Check if user has access to a ministry based on its campus
 * Returns true if ministry has no campus or user is in the ministry's campus
 */
export async function hasMinistryAccess(
  profileId: string,
  ministryCampusId: string | null,
  adminClient: AdminClient
): Promise<boolean> {
  return isInUserCampus(profileId, ministryCampusId, adminClient)
}

/**
 * Get ministries filtered by user's campuses
 * For admins/owners, returns all ministries
 * For leaders, returns only ministries in their campuses
 */
export async function getAccessibleMinistryIds(
  profileId: string,
  churchId: string,
  role: string,
  adminClient: AdminClient
): Promise<string[] | null> {
  // Admins and owners can access all ministries
  if (role === 'admin' || role === 'owner') {
    return null // null means no filtering needed
  }

  // For leaders, get their campus IDs first
  const userCampusIds = await getUserCampusIds(profileId, adminClient)

  if (userCampusIds.length === 0) {
    return [] // No campuses = no ministry access
  }

  // Get ministries in user's campuses
  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select('id')
    .eq('church_id', churchId)
    .or(`campus_id.is.null,campus_id.in.(${userCampusIds.join(',')})`)

  if (error) {
    console.error('Error fetching accessible ministries:', error)
    return []
  }

  return ministries?.map((m) => m.id) ?? []
}
