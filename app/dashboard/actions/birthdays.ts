'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

export interface Birthday {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  dateOfBirth: string
  ministryName: string | null
  ministryColor: string | null
}

export interface CalendarBirthday {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  date: string // ISO date string for this year (YYYY-MM-DD)
}

/**
 * Get upcoming birthdays for the dashboard (Quick Access section)
 * - Leaders: See birthdays of members in ministries they lead
 * - Admins/Owners: See birthdays of members in ministries they lead + all leaders
 */
export async function getUpcomingBirthdays(): Promise<{ data?: Birthday[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth
  const role = profile.role

  // Only leaders, admins, owners can see birthdays
  if (!['leader', 'admin', 'owner'].includes(role)) {
    return { data: [] }
  }

  // Import birthday helpers dynamically to keep server action clean
  const { isBirthdayInRange, sortBirthdaysByProximity } = await import('@/lib/utils/birthday-helpers')

  const allBirthdays: Birthday[] = []

  // Get ministries this user leads (same for all roles - only ministries they lead)
  const { data: ministries } = await adminClient
    .from('ministries')
    .select('id, name, color')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .eq('leader_id', profile.id)

  if (ministries && ministries.length > 0) {
    const ministryIds = ministries.map((m) => m.id)
    const ministryMap = new Map(ministries.map((m) => [m.id, m]))

    // Get members of these ministries with birthdays
    const { data: members } = await adminClient
      .from('ministry_members')
      .select(`
        ministry_id,
        profile:profiles (
          id,
          first_name,
          last_name,
          avatar_url,
          date_of_birth
        )
      `)
      .in('ministry_id', ministryIds)
      .eq('is_active', true)

    if (members) {
      for (const member of members) {
        const p = Array.isArray(member.profile) ? member.profile[0] : member.profile
        if (!p || !p.date_of_birth) continue

        // Skip the user's own birthday - they probably remember that one
        if (p.id === profile.id) continue

        // Check if birthday is in range (-7 to +14 days)
        if (isBirthdayInRange(p.date_of_birth, -7, 14)) {
          const ministry = ministryMap.get(member.ministry_id)
          allBirthdays.push({
            id: p.id,
            firstName: p.first_name,
            lastName: p.last_name,
            avatarUrl: p.avatar_url,
            dateOfBirth: p.date_of_birth,
            ministryName: ministry?.name || null,
            ministryColor: ministry?.color || null,
          })
        }
      }
    }
  }

  // For admins/owners: Also include all leaders' birthdays
  if (['admin', 'owner'].includes(role)) {
    const { data: leaders } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, date_of_birth')
      .eq('church_id', profile.church_id)
      .eq('role', 'leader')
      .eq('active', true)
      .not('date_of_birth', 'is', null)

    if (leaders) {
      for (const leader of leaders) {
        if (!leader.date_of_birth) continue

        // Skip the user's own birthday
        if (leader.id === profile.id) continue

        // Check if birthday is in range (-7 to +14 days)
        if (isBirthdayInRange(leader.date_of_birth, -7, 14)) {
          // Check if already added (avoid duplicates)
          if (!allBirthdays.some((b) => b.id === leader.id)) {
            allBirthdays.push({
              id: leader.id,
              firstName: leader.first_name,
              lastName: leader.last_name,
              avatarUrl: leader.avatar_url,
              dateOfBirth: leader.date_of_birth,
              ministryName: 'Church Leader',
              ministryColor: null,
            })
          }
        }
      }
    }
  }

  // Sort by proximity (upcoming first)
  const sorted = sortBirthdaysByProximity(allBirthdays)

  return { data: sorted }
}

/**
 * Get birthdays for a specific month (for calendar display)
 * - Admin/Owner: See ALL church members' birthdays
 * - Leader: See birthdays only of people in their campuses
 * - Volunteer/Member: No birthdays
 */
export async function getCalendarBirthdays(
  month: number,
  year: number
): Promise<{ data?: CalendarBirthday[]; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth
  const role = profile.role

  // Only leaders and above can see birthdays on the calendar
  if (!['leader', 'admin', 'owner'].includes(role)) {
    return { data: [] }
  }

  const isLeaderOnly = role === 'leader'

  // For leaders, get their campus IDs first
  let leaderCampusProfileIds: Set<string> | null = null
  if (isLeaderOnly) {
    // Get leader's campuses
    const { data: leaderCampuses } = await adminClient
      .from('profile_campuses')
      .select('campus_id')
      .eq('profile_id', profile.id)

    if (leaderCampuses && leaderCampuses.length > 0) {
      const campusIds = leaderCampuses.map((c) => c.campus_id)

      // Get all profile IDs in those campuses
      const { data: campusProfiles } = await adminClient
        .from('profile_campuses')
        .select('profile_id')
        .in('campus_id', campusIds)

      leaderCampusProfileIds = new Set(campusProfiles?.map((p) => p.profile_id) || [])
    } else {
      // Leader has no campuses, show no birthdays
      return { data: [] }
    }
  }

  // Get active church members with birthdays
  const { data: members, error } = await adminClient
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, date_of_birth')
    .eq('church_id', profile.church_id)
    .eq('active', true)
    .not('date_of_birth', 'is', null)

  if (error) {
    console.error('Error fetching calendar birthdays:', error)
    return { error: 'Failed to fetch birthdays' }
  }

  const birthdays: CalendarBirthday[] = []

  for (const member of members || []) {
    if (!member.date_of_birth) continue

    // For leaders, filter by campus membership
    if (isLeaderOnly && leaderCampusProfileIds && !leaderCampusProfileIds.has(member.id)) {
      continue
    }

    // Check if birthday is in this month
    const dob = new Date(member.date_of_birth)
    if (dob.getMonth() === month) {
      birthdays.push({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        avatarUrl: member.avatar_url,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`,
      })
    }
  }

  return { data: birthdays }
}
