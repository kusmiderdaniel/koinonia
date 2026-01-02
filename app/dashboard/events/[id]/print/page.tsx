import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { canUserSeeEvent } from '../../actions/helpers'
import { getUserCampusIds } from '@/lib/utils/campus'
import { AgendaPrintView } from './AgendaPrintView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventPrintPage({ params }: PageProps) {
  const { id: eventId } = await params

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

  // Fetch event with agenda items
  const { data: event, error } = await adminClient
    .from('events')
    .select(`
      id,
      title,
      description,
      event_type,
      start_time,
      end_time,
      location:locations (id, name, address),
      responsible_person:profiles!responsible_person_id (id, first_name, last_name),
      event_agenda_items (
        id,
        title,
        description,
        duration_seconds,
        sort_order,
        song_key,
        is_song_placeholder,
        leader:profiles (id, first_name, last_name),
        ministry:ministries (id, name, color),
        song:songs (id, title, artist, default_key, duration_seconds)
      ),
      event_invitations (profile_id),
      event_campuses (campus:campuses (id, name, color))
    `)
    .eq('id', eventId)
    .eq('church_id', profile.church_id)
    .single()

  if (error || !event) {
    notFound()
  }

  // Check visibility permissions
  const invitedProfileIds = event.event_invitations?.map((inv: { profile_id: string }) => inv.profile_id) || []
  if (!canUserSeeEvent(profile.role, 'members', profile.id, invitedProfileIds)) {
    notFound()
  }

  // For volunteers and leaders, check campus access
  if (profile.role === 'volunteer' || profile.role === 'leader') {
    const campuses: { id: string }[] = []
    for (const ec of event.event_campuses || []) {
      const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
      if (campus?.id) {
        campuses.push(campus)
      }
    }
    const eventCampusIds = campuses.map(c => c.id)

    if (eventCampusIds.length > 0) {
      const userCampusIds = await getUserCampusIds(profile.id, adminClient)
      const hasAccess = eventCampusIds.some((campusId: string) => userCampusIds.includes(campusId))
      if (!hasAccess) {
        notFound()
      }
    }
  }

  // Sort agenda items by sort_order
  const sortedAgendaItems = [...(event.event_agenda_items || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  // Transform the data for the client component
  const transformedEvent = {
    id: event.id,
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    start_time: event.start_time,
    end_time: event.end_time,
    location: Array.isArray(event.location) ? event.location[0] : event.location,
    responsible_person: Array.isArray(event.responsible_person) ? event.responsible_person[0] : event.responsible_person,
    agenda_items: sortedAgendaItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      duration_seconds: item.duration_seconds,
      sort_order: item.sort_order,
      song_key: item.song_key,
      is_song_placeholder: item.is_song_placeholder,
      leader: Array.isArray(item.leader) ? item.leader[0] : item.leader,
      ministry: Array.isArray(item.ministry) ? item.ministry[0] : item.ministry,
      song: Array.isArray(item.song) ? item.song[0] : item.song,
    })),
  }

  return <AgendaPrintView event={transformedEvent} />
}
