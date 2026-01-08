import { format, startOfDay, addDays } from 'date-fns'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { formatTimeFromDate, type TimeFormat } from '@/lib/utils/format'
import { sendEmail } from '@/lib/email/config'
import { UnfilledPositionsReminderEmail, type UnfilledPosition } from '@/emails/UnfilledPositionsReminderEmail'
import {
  parseNotificationPreferences,
  shouldNotify,
  shouldSendUnfilledReminder,
} from '@/lib/notifications/preferences'

interface EventWithPositions {
  id: string
  title: string
  start_time: string
  end_time: string | null
  church_id: string
  responsible_person_id: string | null
  church: { name: string; time_format: string | null }
  responsible_person: {
    id: string
    first_name: string
    email: string | null
    receive_email_notifications: boolean
    notification_preferences: unknown
  } | null
  event_positions: Array<{
    id: string
    title: string
    quantity_needed: number
    ministry: { id: string; name: string; leader_id: string | null }
    event_assignments: Array<{
      id: string
      status: string | null
    }>
  }>
}

interface LeaderInfo {
  id: string
  first_name: string
  email: string | null
  receive_email_notifications: boolean
  notification_preferences: unknown
}

/**
 * Find all events with unfilled or declined positions within the next 7 days.
 */
export async function getEventsWithUnfilledPositions() {
  const adminClient = createServiceRoleClient()
  const today = startOfDay(new Date())
  const maxDate = addDays(today, 7)

  const { data: events, error } = await adminClient
    .from('events')
    .select(`
      id,
      title,
      start_time,
      end_time,
      church_id,
      responsible_person_id,
      church:churches!inner (name, time_format),
      responsible_person:profiles!events_responsible_person_id_fkey (
        id,
        first_name,
        email,
        receive_email_notifications,
        notification_preferences
      ),
      event_positions (
        id,
        title,
        quantity_needed,
        ministry:ministries (
          id,
          name,
          leader_id
        ),
        event_assignments (
          id,
          status
        )
      )
    `)
    .gte('start_time', today.toISOString())
    .lte('start_time', maxDate.toISOString())
    .eq('status', 'published')

  if (error) {
    console.error('[UnfilledReminder] Failed to fetch events:', error)
    return []
  }

  // Filter to events that have unfilled or declined positions
  const eventsWithIssues: EventWithPositions[] = []

  for (const event of events || []) {
    const church = Array.isArray(event.church) ? event.church[0] : event.church
    const responsiblePerson = Array.isArray(event.responsible_person)
      ? event.responsible_person[0]
      : event.responsible_person

    const positionsWithIssues = (event.event_positions || []).filter((pos) => {
      const acceptedCount = (pos.event_assignments || []).filter(
        (a) => a.status === 'accepted'
      ).length
      const hasDeclined = (pos.event_assignments || []).some(
        (a) => a.status === 'declined'
      )
      const isUnfilled = acceptedCount < pos.quantity_needed

      return isUnfilled || hasDeclined
    })

    if (positionsWithIssues.length > 0) {
      eventsWithIssues.push({
        ...event,
        church,
        responsible_person: responsiblePerson || null,
        event_positions: positionsWithIssues.map((pos) => ({
          ...pos,
          ministry: Array.isArray(pos.ministry) ? pos.ministry[0] : pos.ministry,
        })),
      } as EventWithPositions)
    }
  }

  return eventsWithIssues
}

/**
 * Get unfilled position details for an event.
 */
function getUnfilledPositionDetails(event: EventWithPositions): UnfilledPosition[] {
  const positions: UnfilledPosition[] = []

  for (const pos of event.event_positions) {
    const acceptedCount = (pos.event_assignments || []).filter(
      (a) => a.status === 'accepted'
    ).length
    const hasDeclined = (pos.event_assignments || []).some(
      (a) => a.status === 'declined'
    )
    const isUnfilled = acceptedCount < pos.quantity_needed

    if (isUnfilled) {
      positions.push({
        positionTitle: pos.title,
        ministryName: pos.ministry?.name || 'Ministry',
        status: 'unfilled',
      })
    } else if (hasDeclined) {
      positions.push({
        positionTitle: pos.title,
        ministryName: pos.ministry?.name || 'Ministry',
        status: 'declined',
      })
    }
  }

  return positions
}

/**
 * Get all leaders who should be notified for an event.
 * This includes the event responsible person and ministry leaders of affected positions.
 */
async function getLeadersToNotify(
  event: EventWithPositions
): Promise<LeaderInfo[]> {
  const adminClient = createServiceRoleClient()
  const leaderIds = new Set<string>()

  // Add event responsible person
  if (event.responsible_person_id) {
    leaderIds.add(event.responsible_person_id)
  }

  // Add ministry leaders of affected positions
  for (const pos of event.event_positions) {
    if (pos.ministry?.leader_id) {
      leaderIds.add(pos.ministry.leader_id)
    }
  }

  if (leaderIds.size === 0) {
    return []
  }

  const { data: leaders, error } = await adminClient
    .from('profiles')
    .select('id, first_name, email, receive_email_notifications, notification_preferences')
    .in('id', Array.from(leaderIds))

  if (error) {
    console.error('[UnfilledReminder] Failed to fetch leaders:', error)
    return []
  }

  return (leaders || []) as LeaderInfo[]
}

/**
 * Send unfilled positions reminder notifications.
 * Called by cron job daily.
 */
export async function sendUnfilledPositionReminders() {
  const adminClient = createServiceRoleClient()
  const events = await getEventsWithUnfilledPositions()
  const today = new Date()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  let notificationsSent = 0
  let emailsSent = 0

  for (const event of events) {
    const eventDate = new Date(event.start_time)
    const positions = getUnfilledPositionDetails(event)
    const leaders = await getLeadersToNotify(event)

    // Format event date/time for notifications
    const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy')
    const timeFormat = (event.church?.time_format || '24h') as TimeFormat
    const formattedTime = event.end_time
      ? `${formatTimeFromDate(eventDate, timeFormat)} - ${formatTimeFromDate(new Date(event.end_time), timeFormat)}`
      : formatTimeFromDate(eventDate, timeFormat)

    for (const leader of leaders) {
      const prefs = parseNotificationPreferences(leader.notification_preferences)

      // Check if we should notify this leader based on their days_before setting
      if (!shouldSendUnfilledReminder(prefs, eventDate, today)) {
        continue
      }

      // Check in-app notification preference
      if (shouldNotify(prefs, 'unfilled_positions_reminder', 'in_app')) {
        const { error: notifyError } = await adminClient
          .from('notifications')
          .insert({
            church_id: event.church_id,
            recipient_id: leader.id,
            type: 'unfilled_positions_reminder',
            title: 'Positions Need Attention',
            message: `${positions.length} position${positions.length > 1 ? 's' : ''} need${positions.length === 1 ? 's' : ''} attention for "${event.title}" on ${formattedDate}`,
            event_id: event.id,
          })

        if (notifyError) {
          console.error('[UnfilledReminder] Failed to create notification:', notifyError)
        } else {
          notificationsSent++
        }
      }

      // Check email notification preference
      if (
        leader.email &&
        leader.receive_email_notifications &&
        shouldNotify(prefs, 'unfilled_positions_reminder', 'email')
      ) {
        sendEmail({
          to: leader.email,
          subject: `Positions need attention for ${event.title}`,
          react: UnfilledPositionsReminderEmail({
            recipientName: leader.first_name,
            eventTitle: event.title,
            eventDate: formattedDate,
            eventTime: formattedTime,
            positions,
            viewEventUrl: `${siteUrl}/dashboard/events/${event.id}`,
            churchName: event.church.name,
          }),
        }).catch((err) => console.error('[Email] Failed to send unfilled reminder:', err))

        emailsSent++
      }
    }
  }

  return {
    eventsProcessed: events.length,
    notificationsSent,
    emailsSent,
  }
}
