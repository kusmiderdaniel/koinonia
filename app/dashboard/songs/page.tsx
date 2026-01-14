export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { SongsPageClient } from './SongsPageClient'
import { hasPageAccess, isLeaderOrAbove } from '@/lib/permissions'
import type { Song } from './types'

export default async function SongsPage() {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's profile with church context
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check page access - block volunteers and members from songs page
  if (!hasPageAccess(profile.role, 'songs')) {
    redirect('/dashboard')
  }

  // Fetch songs with tags server-side
  const { data: songs } = await adminClient
    .from('songs')
    .select(`
      *,
      created_by_profile:profiles!songs_created_by_fkey (
        id,
        first_name,
        last_name
      ),
      song_tag_assignments (
        tag:song_tags (
          id,
          name,
          color
        )
      )
    `)
    .eq('church_id', profile.church_id)
    .order('title', { ascending: true })

  // Transform to flatten tags
  const transformedSongs = songs?.map((song) => ({
    ...song,
    tags: song.song_tag_assignments
      ?.map((sta: { tag: { id: string; name: string; color: string } | null }) => sta.tag)
      .filter(Boolean) || [],
  })) || []

  const canManage = isLeaderOrAbove(profile.role)

  return (
    <SongsPageClient
      initialData={{
        songs: transformedSongs as Song[],
        canManage,
      }}
    />
  )
}
