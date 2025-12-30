import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MembersTable } from './members-table'
import { OfflineMemberDialog } from './offline-member-dialog'
import { InvitePopover } from './invite-popover'

export default async function PeoplePage() {
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

  const isAdmin = profile.role === 'admin' || profile.role === 'owner'

  // Parallel fetch: members + admin-only data (pending count, join code)
  const [membersResult, pendingResult, churchResult] = await Promise.all([
    // Always fetch members
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, role, active, date_of_birth, sex, date_of_departure, reason_for_departure, baptism, baptism_date, member_type, created_at')
      .eq('church_id', profile.church_id)
      .order('created_at', { ascending: false }),
    // Fetch pending count only for admins
    isAdmin
      ? adminClient
          .from('pending_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', profile.church_id)
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
    // Fetch join code only for admins
    isAdmin
      ? adminClient
          .from('churches')
          .select('join_code')
          .eq('id', profile.church_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const { data: membersData, error: membersError } = membersResult
  const pendingCount = pendingResult.count || 0
  const joinCode = churchResult.data?.join_code || ''

  if (membersError) {
    console.error('Error fetching members:', membersError)
  }

  // Then fetch ministry memberships with roles for all members
  const memberIds = membersData?.map(m => m.id) || []
  const { data: ministryMemberships } = memberIds.length > 0
    ? await adminClient
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
    : { data: [] }

  // Build a Map for O(1) lookups instead of O(n) filtering per member
  const ministryMembershipsByProfileId = new Map<string, typeof ministryMemberships>()
  for (const mm of ministryMemberships || []) {
    const existing = ministryMembershipsByProfileId.get(mm.profile_id) || []
    existing.push(mm)
    ministryMembershipsByProfileId.set(mm.profile_id, existing)
  }

  // Combine the data - flatten ministry_member_roles into individual entries
  const members = membersData?.map(member => {
    const memberMinistries = ministryMembershipsByProfileId.get(member.id) || []

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

    return {
      ...member,
      ministry_members: ministryRoles,
    }
  }) || []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-muted-foreground">
            {members?.length || 0} member{members?.length !== 1 ? 's' : ''} in your church
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Button variant="outline" asChild className="!border !border-gray-300">
                <Link href="/dashboard/people/pending" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Pending
                  <Badge variant="destructive" className="ml-1 bg-red-500 text-white rounded-full">
                    {pendingCount}
                  </Badge>
                </Link>
              </Button>
            )}
            <OfflineMemberDialog />
            {joinCode && <InvitePopover joinCode={joinCode} />}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Church Members</CardTitle>
          <CardDescription>
            All members who have joined your church. {isAdmin && 'Click on a role to change it.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <MembersTable
              members={members}
              currentUserId={profile.id}
              currentUserRole={profile.role}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No members yet. Share your invite link to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
