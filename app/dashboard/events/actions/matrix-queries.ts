'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from './helpers'
import type {
  MatrixFilters,
  MatrixEvent,
  MatrixRow,
  MatrixData,
  MatrixAgendaItem,
  MatrixMinistryGroup,
  MatrixPosition,
  MatrixUnavailability,
  MatrixMultiAssignment,
} from '../matrix/types'

interface GetMatrixDataOptions {
  filters: MatrixFilters
  limit?: number
}

/**
 * Fetch events with full agenda and position data for the scheduling matrix
 */
export async function getMatrixData(options: GetMatrixDataOptions): Promise<{ data?: MatrixData; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth
  const { filters, limit = 6 } = options

  // Build events query with full data
  let eventsQuery = adminClient
    .from('events')
    .select(`
      id,
      title,
      start_time,
      end_time,
      event_type,
      status,
      event_campuses (campus:campuses (id, name, color)),
      event_agenda_items (
        id,
        title,
        description,
        sort_order,
        song_id,
        song_key,
        is_song_placeholder,
        leader_id,
        ministry_id,
        song:songs (id, title, default_key),
        leader:profiles!event_agenda_items_leader_id_fkey (id, first_name, last_name),
        ministry:ministries (id, name, color)
      ),
      event_positions (
        id,
        title,
        sort_order,
        ministry:ministries (id, name, color),
        event_assignments (
          id,
          profile_id,
          status,
          profile:profiles!event_assignments_profile_id_fkey (id, first_name, last_name)
        )
      )
    `)
    .eq('church_id', profile.church_id)
    .eq('status', 'published')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(limit)

  // Apply filters
  if (filters.eventType) {
    eventsQuery = eventsQuery.eq('event_type', filters.eventType)
  }

  const { data: events, error: eventsError } = await eventsQuery

  if (eventsError) {
    console.error('Error fetching matrix events:', eventsError)
    return { error: 'Failed to load events for matrix' }
  }

  if (!events || events.length === 0) {
    return {
      data: {
        events: [],
        rows: [],
        unavailabilityByEvent: {},
        multiAssignmentsByEvent: {},
      },
    }
  }

  // Filter by campus if specified
  let filteredEvents = events
  if (filters.campusId) {
    filteredEvents = events.filter((event) => {
      const eventCampusIds = (event.event_campuses || []).map((ec: { campus: { id: string } | { id: string }[] }) => {
        const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
        return campus?.id
      }).filter(Boolean)

      // Show events with no campus (church-wide) or matching campus
      return eventCampusIds.length === 0 || (filters.campusId && eventCampusIds.includes(filters.campusId))
    })
  }

  // Filter by ministry if specified
  // Check both event_positions AND event_agenda_items for ministry matches
  if (filters.ministryIds && filters.ministryIds.length > 0) {
    filteredEvents = filteredEvents.filter((event) => {
      // Get ministry IDs from positions
      const positionMinistryIds = (event.event_positions || []).map((p: { ministry: { id: string } | { id: string }[] }) => {
        const ministry = Array.isArray(p.ministry) ? p.ministry[0] : p.ministry
        return ministry?.id
      }).filter(Boolean)

      // Get ministry IDs from agenda items (includes songs)
      const agendaMinistryIds = (event.event_agenda_items || []).map((item: { ministry_id: string | null }) => {
        return item.ministry_id
      }).filter(Boolean)

      // Combine both sets of ministry IDs
      const eventMinistryIds = [...new Set([...positionMinistryIds, ...agendaMinistryIds])].filter((id): id is string => id !== null)

      return eventMinistryIds.some((mid) => filters.ministryIds!.includes(mid))
    })
  }

  // Transform events to matrix format
  const matrixEvents: MatrixEvent[] = filteredEvents.map((event) => {
    // Extract campuses
    const campuses = (event.event_campuses || []).map((ec: { campus: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] }) => {
      const campus = Array.isArray(ec.campus) ? ec.campus[0] : ec.campus
      return campus
    }).filter(Boolean)

    // Extract all agenda items (sorted by sort_order)
    const sortedAgendaItems = [...(event.event_agenda_items || [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    )

    // Filter agenda items by ministry if specified
    const filteredAgendaItems = filters.ministryIds && filters.ministryIds.length > 0
      ? sortedAgendaItems.filter((item: { ministry_id: string | null }) =>
          item.ministry_id && filters.ministryIds!.includes(item.ministry_id)
        )
      : sortedAgendaItems

    const agendaItems: MatrixAgendaItem[] = filteredAgendaItems.map((item: {
      id: string
      title: string
      description: string | null
      song_id: string | null
      song_key: string | null
      is_song_placeholder: boolean
      leader_id: string | null
      ministry_id: string | null
      song: { id: string; title: string; default_key: string | null } | { id: string; title: string; default_key: string | null }[] | null
      leader: { id: string; first_name: string; last_name: string } | { id: string; first_name: string; last_name: string }[] | null
      ministry: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null
    }) => {
      const song = Array.isArray(item.song) ? item.song[0] : item.song
      const leader = Array.isArray(item.leader) ? item.leader[0] : item.leader
      const ministry = Array.isArray(item.ministry) ? item.ministry[0] : item.ministry
      const isSong = item.song_id !== null || item.is_song_placeholder

      return {
        agendaItemId: item.id,
        title: item.title,
        description: item.description,
        isSong,
        songId: song?.id || null,
        songTitle: song?.title || null,
        songKey: item.song_key || song?.default_key || null,
        isPlaceholder: item.is_song_placeholder,
        leaderId: leader?.id || null,
        leaderFirstName: leader?.first_name || null,
        leaderLastName: leader?.last_name || null,
        ministryId: ministry?.id || null,
        ministryName: ministry?.name || null,
        ministryColor: ministry?.color || null,
      }
    })

    // Extract positions grouped by ministry
    const positionsByMinistry: MatrixMinistryGroup[] = []
    const ministryMap = new Map<string, MatrixMinistryGroup>()

    const positions = [...(event.event_positions || [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    )

    for (const pos of positions) {
      const ministry = Array.isArray(pos.ministry) ? pos.ministry[0] : pos.ministry
      if (!ministry) continue

      // Filter by ministry if specified
      if (filters.ministryIds && filters.ministryIds.length > 0) {
        if (!filters.ministryIds.includes(ministry.id)) continue
      }

      let group = ministryMap.get(ministry.id)
      if (!group) {
        group = {
          ministryId: ministry.id,
          ministryName: ministry.name,
          ministryColor: ministry.color || '#3B82F6',
          positions: [],
        }
        ministryMap.set(ministry.id, group)
        positionsByMinistry.push(group)
      }

      const assignments = pos.event_assignments || []
      const firstAssignment = assignments[0]
      const assignmentProfile = firstAssignment?.profile
        ? (Array.isArray(firstAssignment.profile) ? firstAssignment.profile[0] : firstAssignment.profile)
        : null

      const matrixPosition: MatrixPosition = {
        positionId: pos.id,
        title: pos.title,
        assignment: firstAssignment && assignmentProfile ? {
          assignmentId: firstAssignment.id,
          profileId: assignmentProfile.id,
          firstName: assignmentProfile.first_name,
          lastName: assignmentProfile.last_name,
          status: firstAssignment.status,
        } : null,
      }

      group.positions.push(matrixPosition)
    }

    return {
      id: event.id,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      event_type: event.event_type,
      campuses,
      agendaItems,
      positionsByMinistry,
    }
  })

  // Compute unified rows from all events
  const rows = computeMatrixRows(matrixEvents)

  // Fetch unavailability for event dates
  const eventDates = matrixEvents.map((e) => e.start_time.split('T')[0])
  const uniqueDates = [...new Set(eventDates)]

  // Get all profile IDs that might be relevant (from assignments)
  const allProfileIds = new Set<string>()
  for (const event of matrixEvents) {
    for (const group of event.positionsByMinistry) {
      for (const pos of group.positions) {
        if (pos.assignment) {
          allProfileIds.add(pos.assignment.profileId)
        }
      }
    }
  }

  // Fetch unavailability for these dates
  const unavailabilityByEvent: Record<string, MatrixUnavailability[]> = {}
  const multiAssignmentsByEvent: Record<string, MatrixMultiAssignment[]> = {}

  if (uniqueDates.length > 0) {
    const { data: unavailabilityData } = await adminClient
      .from('volunteer_unavailability')
      .select('profile_id, start_date, end_date, reason, profile:profiles (id, first_name, last_name)')
      .eq('church_id', profile.church_id)

    // Map unavailability to events
    for (const event of matrixEvents) {
      const eventDate = event.start_time.split('T')[0]
      const unavailable: MatrixUnavailability[] = []

      for (const u of unavailabilityData || []) {
        if (eventDate >= u.start_date && eventDate <= u.end_date) {
          const profileData = Array.isArray(u.profile) ? u.profile[0] : u.profile
          if (profileData) {
            unavailable.push({
              profileId: u.profile_id,
              firstName: profileData.first_name,
              lastName: profileData.last_name,
              reason: u.reason,
            })
          }
        }
      }

      unavailabilityByEvent[event.id] = unavailable
    }
  }

  // Compute multi-assignments within each event
  for (const event of matrixEvents) {
    const profilePositions = new Map<string, { firstName: string; lastName: string; positions: string[] }>()

    for (const group of event.positionsByMinistry) {
      for (const pos of group.positions) {
        if (pos.assignment) {
          const existing = profilePositions.get(pos.assignment.profileId)
          if (existing) {
            existing.positions.push(pos.title)
          } else {
            profilePositions.set(pos.assignment.profileId, {
              firstName: pos.assignment.firstName,
              lastName: pos.assignment.lastName,
              positions: [pos.title],
            })
          }
        }
      }
    }

    const multiAssigned: MatrixMultiAssignment[] = []
    profilePositions.forEach((data, profileId) => {
      if (data.positions.length > 1) {
        multiAssigned.push({
          profileId,
          firstName: data.firstName,
          lastName: data.lastName,
          positions: data.positions,
        })
      }
    })

    multiAssignmentsByEvent[event.id] = multiAssigned
  }

  return {
    data: {
      events: matrixEvents,
      rows,
      unavailabilityByEvent,
      multiAssignmentsByEvent,
    },
  }
}

/**
 * Compute unified rows from all events
 */
function computeMatrixRows(events: MatrixEvent[]): MatrixRow[] {
  const rows: MatrixRow[] = []

  // Find max agenda items across all events
  let maxAgendaItems = 0
  for (const event of events) {
    maxAgendaItems = Math.max(maxAgendaItems, event.agendaItems.length)
  }

  // Add agenda header and items
  if (maxAgendaItems > 0) {
    rows.push({ type: 'agenda-header', key: 'agenda-header', label: 'Agenda' })
    for (let i = 0; i < maxAgendaItems; i++) {
      rows.push({
        type: 'agenda-item',
        key: `agenda-${i}`,
        label: `${i + 1}.`,
        agendaIndex: i,
      })
    }
  }

  // Collect all unique positions by ministry
  const ministryPositions = new Map<string, {
    ministryId: string
    ministryName: string
    ministryColor: string
    positionTitles: Set<string>
  }>()

  for (const event of events) {
    for (const group of event.positionsByMinistry) {
      let existing = ministryPositions.get(group.ministryId)
      if (!existing) {
        existing = {
          ministryId: group.ministryId,
          ministryName: group.ministryName,
          ministryColor: group.ministryColor,
          positionTitles: new Set(),
        }
        ministryPositions.set(group.ministryId, existing)
      }
      for (const pos of group.positions) {
        existing.positionTitles.add(pos.title)
      }
    }
  }

  // Add position rows grouped by ministry
  for (const [, ministry] of ministryPositions) {
    rows.push({
      type: 'ministry-header',
      key: `ministry-${ministry.ministryId}`,
      label: ministry.ministryName,
      ministryId: ministry.ministryId,
      ministryColor: ministry.ministryColor,
    })

    const sortedTitles = [...ministry.positionTitles].sort()
    for (const title of sortedTitles) {
      rows.push({
        type: 'position',
        key: `position-${ministry.ministryId}-${title}`,
        label: title,
        ministryId: ministry.ministryId,
        ministryColor: ministry.ministryColor,
        positionTitle: title,
      })
    }
  }

  // Add availability header
  rows.push({ type: 'availability-header', key: 'availability-header', label: 'Availability' })

  return rows
}

/**
 * Get ministries for filter dropdown
 */
export async function getMatrixMinistries() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('ministries')
    .select('id, name, color')
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching ministries:', error)
    return { error: 'Failed to load ministries' }
  }

  return { data: data || [] }
}

/**
 * Get campuses for filter dropdown
 */
export async function getMatrixCampuses() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('campuses')
    .select('id, name, color')
    .eq('church_id', profile.church_id)
    .order('name')

  if (error) {
    console.error('Error fetching campuses:', error)
    return { error: 'Failed to load campuses' }
  }

  return { data: data || [] }
}
