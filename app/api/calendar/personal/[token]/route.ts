import { createServiceRoleClient } from '@/lib/supabase/server'
import icalGenerator from 'ical-generator'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

interface EventData {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  is_all_day: boolean
  status: string
  visibility?: string
  location: { name: string; address: string | null } | null
}

interface PositionData {
  title: string
  event: EventData | null
}

interface AssignmentData {
  status: string | null
  position: PositionData | null
}

interface HiddenInvitationData {
  event: (EventData & { visibility: string }) | null
}

interface RoleInfo {
  title: string
  status: string | null
}

interface AggregatedEvent {
  event: EventData
  roles: RoleInfo[]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limit to prevent token brute-force attacks
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'token')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  const { token } = await params

  if (!token || token.length < 20) {
    return new Response('Invalid token', { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Lookup user by token
  const { data: tokenData, error: tokenError } = await supabase
    .from('calendar_tokens')
    .select('profile_id, church_id')
    .eq('token', token)
    .single()

  if (tokenError || !tokenData) {
    return new Response('Invalid or expired token', { status: 401 })
  }

  const { profile_id: profileId, church_id: churchId } = tokenData

  // Get profile info for calendar name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', profileId)
    .single()

  // Get church info
  const { data: church } = await supabase
    .from('churches')
    .select('name')
    .eq('id', churchId)
    .single()

  // Fetch events where user has assignments with status invited or accepted
  const { data: assignments } = await supabase
    .from('event_assignments')
    .select(
      `
      status,
      position:event_positions (
        title,
        event:events (
          id,
          title,
          description,
          start_time,
          end_time,
          is_all_day,
          status,
          location:locations (name, address)
        )
      )
    `
    )
    .eq('profile_id', profileId)
    .in('status', ['invited', 'accepted'])

  // Fetch hidden events user is invited to (via event_invitations table)
  const { data: hiddenInvitations } = await supabase
    .from('event_invitations')
    .select(
      `
      event:events (
        id,
        title,
        description,
        start_time,
        end_time,
        is_all_day,
        status,
        visibility,
        location:locations (name, address)
      )
    `
    )
    .eq('profile_id', profileId)

  // Create calendar
  const calendar = icalGenerator({
    name: `${profile?.first_name || 'My'} ${profile?.last_name || 'Calendar'} - ${church?.name || 'Church'}`,
    timezone: 'UTC',
    prodId: { company: 'Koinonia', product: 'Church Calendar' },
  })

  // Aggregate all roles per event
  const eventRolesMap = new Map<string, AggregatedEvent>()

  if (assignments) {
    for (const assignment of assignments as unknown as AssignmentData[]) {
      const position = assignment.position
      const event = position?.event

      if (!event || event.status === 'cancelled') {
        continue
      }

      const existing = eventRolesMap.get(event.id)
      if (existing) {
        // Add this role to the existing event
        existing.roles.push({
          title: position?.title || 'Volunteer',
          status: assignment.status,
        })
      } else {
        // Create new entry for this event
        eventRolesMap.set(event.id, {
          event,
          roles: [
            {
              title: position?.title || 'Volunteer',
              status: assignment.status,
            },
          ],
        })
      }
    }
  }

  // Add events with all their roles to calendar
  for (const [eventId, { event, roles }] of eventRolesMap) {
    const location = event.location
    const locationStr = location
      ? location.address
        ? `${location.name}, ${location.address}`
        : location.name
      : undefined

    // Build description with all roles
    let description = ''
    if (roles.length === 1) {
      description = `Role: ${roles[0].title}`
      if (roles[0].status === 'invited') {
        description += ' (Pending response)'
      }
    } else {
      description = 'Roles:\n'
      for (const role of roles) {
        description += `• ${role.title}`
        if (role.status === 'invited') {
          description += ' (Pending response)'
        }
        description += '\n'
      }
      description = description.trimEnd()
    }

    if (event.description) {
      description += `\n\n${event.description}`
    }

    calendar.createEvent({
      id: eventId,
      summary: event.title,
      description,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: event.is_all_day,
      location: locationStr,
    })
  }

  // Track which events we've added (for hidden invitations)
  const addedEventIds = new Set(eventRolesMap.keys())

  // Add hidden events from invitations (that aren't already added via assignments)
  if (hiddenInvitations) {
    for (const invitation of hiddenInvitations as unknown as HiddenInvitationData[]) {
      const event = invitation.event

      if (!event || event.status === 'cancelled' || addedEventIds.has(event.id)) {
        continue
      }

      // Only add if it's a hidden event
      if (event.visibility !== 'hidden') {
        continue
      }

      addedEventIds.add(event.id)

      const location = event.location
      const locationStr = location
        ? location.address
          ? `${location.name}, ${location.address}`
          : location.name
        : undefined

      let description = 'Invited to this event'
      if (event.description) {
        description += `\n\n${event.description}`
      }

      calendar.createEvent({
        id: event.id,
        summary: event.title,
        description,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        allDay: event.is_all_day,
        location: locationStr,
      })
    }
  }

  // Generate iCal content
  const icalContent = calendar.toString()

  return new Response(icalContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendar.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
