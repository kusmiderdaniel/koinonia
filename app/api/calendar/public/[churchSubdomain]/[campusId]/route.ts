import { createServiceRoleClient } from '@/lib/supabase/server'
import icalGenerator from 'ical-generator'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchSubdomain: string; campusId: string }> }
) {
  const { churchSubdomain, campusId } = await params

  if (!churchSubdomain || !campusId) {
    return new Response('Missing parameters', { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Lookup church by subdomain
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select('id, name')
    .eq('subdomain', churchSubdomain)
    .single()

  if (churchError || !church) {
    return new Response('Church not found', { status: 404 })
  }

  // Verify campus belongs to this church and is active
  const { data: campus, error: campusError } = await supabase
    .from('campuses')
    .select('id, name')
    .eq('id', campusId)
    .eq('church_id', church.id)
    .eq('is_active', true)
    .single()

  if (campusError || !campus) {
    return new Response('Campus not found', { status: 404 })
  }

  // Get event IDs for this campus
  const { data: eventCampusLinks } = await supabase
    .from('event_campuses')
    .select('event_id')
    .eq('campus_id', campusId)

  const eventIds = eventCampusLinks?.map((ec) => ec.event_id) || []

  if (eventIds.length === 0) {
    // No events for this campus, return empty calendar
    const calendar = icalGenerator({
      name: `${church.name} - ${campus.name}`,
      timezone: 'UTC',
      prodId: { company: 'Koinonia', product: 'Church Calendar' },
    })

    return new Response(calendar.toString(), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${church.name}-${campus.name}.ics"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // Fetch published events with visibility 'members' for this campus
  // Include events from the last 30 days to the future
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: events } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      description,
      start_time,
      end_time,
      is_all_day,
      status,
      visibility,
      location:locations (name, address)
    `
    )
    .in('id', eventIds)
    .eq('status', 'published')
    .eq('visibility', 'members')
    .gte('start_time', thirtyDaysAgo.toISOString())
    .order('start_time', { ascending: true })

  // Create calendar
  const calendar = icalGenerator({
    name: `${church.name} - ${campus.name}`,
    timezone: 'UTC',
    prodId: { company: 'Koinonia', product: 'Church Calendar' },
  })

  // Add events
  if (events) {
    for (const event of events) {
      const location = event.location as { name: string; address: string | null } | null
      const locationStr = location
        ? location.address
          ? `${location.name}, ${location.address}`
          : location.name
        : undefined

      calendar.createEvent({
        id: event.id,
        summary: event.title,
        description: event.description || undefined,
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
      'Content-Disposition': `attachment; filename="${church.name}-${campus.name}.ics"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
