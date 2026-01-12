import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MembersTable } from './members-table'
import { OfflineMemberDialog } from './OfflineMemberDialog'
import { InvitePopover } from './invite-popover'
import { getUserCampusIds } from '@/lib/utils/campus'
import { isAdminOrOwner, isLeader } from '@/lib/permissions'
import type { SavedView } from '@/types/saved-views'

export default async function PeoplePage() {
  const t = await getTranslations('people')
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  const adminClient = createServiceRoleClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Only leaders and above can access the People page
  const allowedRoles = ['owner', 'admin', 'leader']
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  const userIsAdmin = isAdminOrOwner(profile.role)
  const userIsLeader = isLeader(profile.role)
  const canViewPending = userIsAdmin || userIsLeader

  // For leaders, get their campus IDs for filtering
  let leaderCampusIds: string[] = []
  if (userIsLeader) {
    leaderCampusIds = await getUserCampusIds(profile.id, adminClient)
  }

  // Parallel fetch: members + pending count + church data + saved views + all campuses
  const [membersResult, pendingResult, churchResult, savedViewsResult, allCampusesResult] = await Promise.all([
    // Always fetch members
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, role, active, date_of_birth, sex, date_of_departure, reason_for_departure, baptism, baptism_date, member_type, created_at')
      .eq('church_id', profile.church_id)
      .order('created_at', { ascending: false }),
    // Fetch pending count for admins and leaders (leaders filtered by campus below)
    canViewPending
      ? (async () => {
          let query = adminClient
            .from('pending_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', profile.church_id)
            .eq('status', 'pending')

          // Leaders only see pending registrations for their campus
          if (userIsLeader && leaderCampusIds.length > 0) {
            query = query.in('campus_id', leaderCampusIds)
          } else if (userIsLeader) {
            // Leader has no campus, so no pending registrations
            return { count: 0 }
          }

          return query
        })()
      : Promise.resolve({ count: 0 }),
    // Fetch church data (join code for admins, first_day_of_week for all)
    adminClient
      .from('churches')
      .select('join_code, first_day_of_week')
      .eq('id', profile.church_id)
      .single(),
    // Fetch saved views for people page
    adminClient
      .from('saved_views')
      .select('id, church_id, view_type, name, description, filter_state, sort_state, group_by, is_default, created_by, created_at, updated_at')
      .eq('church_id', profile.church_id)
      .eq('view_type', 'people')
      .order('is_default', { ascending: false })
      .order('name'),
    // Fetch all campuses for the church
    adminClient
      .from('campuses')
      .select('id, name, color, is_default')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name'),
  ])

  const { data: membersData, error: membersError } = membersResult
  const pendingCount = pendingResult.count || 0
  const joinCode = churchResult.data?.join_code || ''
  const firstDayOfWeek = (churchResult.data?.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6
  const allCampuses = (allCampusesResult.data || []).map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    is_default: c.is_default,
  }))

  if (membersError) {
    console.error('Error fetching members:', membersError)
  }

  // Then fetch ministry memberships with roles and campus assignments for all members
  const memberIds = membersData?.map(m => m.id) || []

  const [ministryMembershipsResult, profileCampusesResult] = await Promise.all([
    memberIds.length > 0
      ? adminClient
          .from('ministry_members')
          .select(`
            id,
            profile_id,
            ministries(id, name, color),
            ministry_member_roles(
              id,
              ministry_roles(id, name)
            )
          `)
          .in('profile_id', memberIds)
      : Promise.resolve({ data: [] }),
    memberIds.length > 0
      ? adminClient
          .from('profile_campuses')
          .select(`
            profile_id,
            is_primary,
            campus:campuses(id, name, color)
          `)
          .in('profile_id', memberIds)
      : Promise.resolve({ data: [] }),
  ])

  const ministryMemberships = ministryMembershipsResult.data || []
  const profileCampuses = profileCampusesResult.data || []

  // Build Maps for O(1) lookups instead of O(n) filtering per member
  const ministryMembershipsByProfileId = new Map<string, typeof ministryMemberships>()
  for (const mm of ministryMemberships || []) {
    const existing = ministryMembershipsByProfileId.get(mm.profile_id) || []
    existing.push(mm)
    ministryMembershipsByProfileId.set(mm.profile_id, existing)
  }

  const campusesByProfileId = new Map<string, typeof profileCampuses>()
  for (const pc of profileCampuses || []) {
    const existing = campusesByProfileId.get(pc.profile_id) || []
    existing.push(pc)
    campusesByProfileId.set(pc.profile_id, existing)
  }

  // Combine the data - flatten ministry_member_roles into individual entries
  const members = membersData?.map(member => {
    const memberMinistries = ministryMembershipsByProfileId.get(member.id) || []
    const memberCampuses = campusesByProfileId.get(member.id) || []

    // Flatten: each role becomes a separate entry with the ministry info
    const ministryRoles: { id: string; role: { id: string; name: string } | null; ministry: { id: string; name: string; color: string } | null }[] = []

    for (const mm of memberMinistries) {
      const ministry = Array.isArray(mm.ministries) ? mm.ministries[0] : mm.ministries
      const memberRoles = mm.ministry_member_roles || []

      for (const mmr of memberRoles as { id: string; ministry_roles: { id: string; name: string } | { id: string; name: string }[] | null }[]) {
        const role = Array.isArray(mmr.ministry_roles) ? mmr.ministry_roles[0] : mmr.ministry_roles
        if (role && ministry) {
          ministryRoles.push({
            id: mmr.id,
            role,
            ministry,
          })
        }
      }
    }

    // Transform campus data
    const campuses = memberCampuses
      .filter(pc => pc.campus)
      .map(pc => {
        const campus = Array.isArray(pc.campus) ? pc.campus[0] : pc.campus
        return {
          id: campus!.id,
          name: campus!.name,
          color: campus!.color,
          is_primary: pc.is_primary,
        }
      })
      .sort((a, b) => {
        // Primary campus first, then alphabetical
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
        return a.name.localeCompare(b.name)
      })

    return {
      ...member,
      ministry_members: ministryRoles,
      campuses,
    }
  }) || []

  // For leaders, filter members to only show those who share a campus with them
  const filteredMembers = userIsLeader && leaderCampusIds.length > 0
    ? members.filter(member => {
        // If member has no campus, leaders can't see them
        if (member.campuses.length === 0) return false
        // Check if member has any campus that overlaps with leader's campuses
        return member.campuses.some(c => leaderCampusIds.includes(c.id))
      })
    : members

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{userIsLeader ? t('titleLeader') : t('title')}</h1>
            <p className="text-muted-foreground">
              {userIsLeader ? t('subtitleLeader') : t('subtitle')} {userIsAdmin && t('subtitleClickRole')}
            </p>
          </div>
          {(userIsAdmin || userIsLeader) && (
            <div className="flex items-center gap-2 flex-wrap">
              {pendingCount > 0 && (
                <Button variant="outline" asChild className="!border !border-black dark:!border-white">
                  <Link href="/dashboard/people/pending" className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden md:inline">{t('pendingBadge')}</span>
                    <Badge variant="destructive" className="bg-red-500 text-white rounded-full">
                      {pendingCount}
                    </Badge>
                  </Link>
                </Button>
              )}
              <OfflineMemberDialog weekStartsOn={firstDayOfWeek} />
              {joinCode && <InvitePopover joinCode={joinCode} />}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {filteredMembers && filteredMembers.length > 0 ? (
            <MembersTable
              members={filteredMembers}
              currentUserId={profile.id}
              currentUserRole={profile.role}
              savedViews={(savedViewsResult.data || []) as SavedView[]}
              canManageViews={userIsAdmin || userIsLeader}
              allCampuses={allCampuses}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {userIsLeader ? t('noMembersLeader') : t('noMembers')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
