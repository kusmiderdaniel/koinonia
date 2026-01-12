'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  unwrapRelation,
} from './helpers'
import type { MinistryData } from './invitations-types'

/**
 * Get pending invitation counts for an event (for the send dialog UI)
 */
export async function getPendingInvitationCounts(eventId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  // Get all assignments without invitations for this event
  const { data: assignments, error } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      position:event_positions!inner (
        id,
        title,
        ministry_id,
        ministry:ministries (id, name, color),
        event_id
      )
    `)
    .is('status', null)
    .eq('position.event_id', eventId)

  if (error) {
    console.error('Error fetching pending counts:', error)
    return { error: 'Failed to fetch pending counts' }
  }

  // Count by ministry
  type SimplePositionData = {
    id: string
    title: string
    ministry_id: string
    ministry: MinistryData | MinistryData[]
    event_id: string
  }
  type SimpleAssignment = { id: string; position: SimplePositionData }

  const ministryCountsMap = new Map<string, { ministry: MinistryData; count: number }>()
  const positionCountsMap = new Map<string, { position: { id: string; title: string }; count: number }>()

  for (const a of (assignments as unknown as SimpleAssignment[])) {
    const position = a.position
    const ministry = unwrapRelation(position.ministry)
    if (!ministry) continue

    // Ministry count
    const existingMinistry = ministryCountsMap.get(ministry.id)
    if (existingMinistry) {
      existingMinistry.count++
    } else {
      ministryCountsMap.set(ministry.id, { ministry, count: 1 })
    }

    // Position count
    const existingPosition = positionCountsMap.get(position.id)
    if (existingPosition) {
      existingPosition.count++
    } else {
      positionCountsMap.set(position.id, {
        position: { id: position.id, title: position.title },
        count: 1,
      })
    }
  }

  return {
    data: {
      total: assignments?.length || 0,
      byMinistry: Array.from(ministryCountsMap.values()),
      byPosition: Array.from(positionCountsMap.values()),
    },
  }
}

/**
 * Get pending invitation counts for the scheduling matrix (across multiple events)
 */
export async function getMatrixPendingInvitationCounts(eventIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { adminClient } = auth

  if (!eventIds.length) {
    return { data: { total: 0, byDate: [], byEvent: [], byMinistry: [], byPosition: [] } }
  }

  // Get all assignments without invitations for these events
  const { data: assignments, error } = await adminClient
    .from('event_assignments')
    .select(`
      id,
      position:event_positions!inner (
        id,
        title,
        ministry_id,
        ministry:ministries (id, name, color),
        event_id,
        event:events!inner (id, title, start_time)
      )
    `)
    .is('status', null)
    .in('position.event_id', eventIds)

  if (error) {
    console.error('Error fetching matrix pending counts:', error)
    return { error: 'Failed to fetch pending counts' }
  }

  type MatrixEventData = { id: string; title: string; start_time: string }
  type MatrixPositionData = {
    id: string
    title: string
    ministry_id: string
    ministry: MinistryData | MinistryData[]
    event_id: string
    event: MatrixEventData | MatrixEventData[]
  }
  type MatrixAssignment = { id: string; position: MatrixPositionData }

  const dateCountsMap = new Map<string, { date: string; eventIds: string[]; count: number }>()
  const eventCountsMap = new Map<string, { event: MatrixEventData; count: number }>()
  const ministryCountsMap = new Map<string, { ministry: MinistryData; count: number }>()
  const positionCountsMap = new Map<string, { position: { id: string; title: string; eventId: string; ministry: MinistryData | null }; count: number }>()

  for (const a of (assignments as unknown as MatrixAssignment[])) {
    const position = a.position
    const ministry = unwrapRelation(position.ministry)
    const event = unwrapRelation(position.event)
    if (!event) continue

    // Date count (group by calendar date)
    const dateKey = event.start_time.split('T')[0] // YYYY-MM-DD format
    const existingDate = dateCountsMap.get(dateKey)
    if (existingDate) {
      existingDate.count++
      if (!existingDate.eventIds.includes(event.id)) {
        existingDate.eventIds.push(event.id)
      }
    } else {
      dateCountsMap.set(dateKey, { date: dateKey, eventIds: [event.id], count: 1 })
    }

    // Event count
    const existingEvent = eventCountsMap.get(event.id)
    if (existingEvent) {
      existingEvent.count++
    } else {
      eventCountsMap.set(event.id, { event, count: 1 })
    }

    // Ministry count
    if (ministry) {
      const existingMinistry = ministryCountsMap.get(ministry.id)
      if (existingMinistry) {
        existingMinistry.count++
      } else {
        ministryCountsMap.set(ministry.id, { ministry, count: 1 })
      }
    }

    // Position count
    const existingPosition = positionCountsMap.get(position.id)
    if (existingPosition) {
      existingPosition.count++
    } else {
      positionCountsMap.set(position.id, {
        position: { id: position.id, title: position.title, eventId: event.id, ministry: ministry || null },
        count: 1,
      })
    }
  }

  return {
    data: {
      total: assignments?.length || 0,
      byDate: Array.from(dateCountsMap.values()).sort(
        (a, b) => a.date.localeCompare(b.date)
      ),
      byEvent: Array.from(eventCountsMap.values()).sort(
        (a, b) => new Date(a.event.start_time).getTime() - new Date(b.event.start_time).getTime()
      ),
      byMinistry: Array.from(ministryCountsMap.values()),
      byPosition: Array.from(positionCountsMap.values()),
    },
  }
}
