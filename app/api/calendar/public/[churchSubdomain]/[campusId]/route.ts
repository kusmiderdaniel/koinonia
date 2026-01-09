import { createServiceRoleClient } from '@/lib/supabase/server'
import icalGenerator from 'ical-generator'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ churchSubdomain: string; campusId: string }> }
) {
  // Rate limit - relaxed for public calendar feeds
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
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
      return new Response(`Church not found: ${churchSubdomain}`, { status: 404 })
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
      return new Response(`Campus not found: ${campusId}`, { status: 404 })
    }

    // Get event IDs for this campus
    const { data: eventCampusLinks, error: linksError } = await supabase
      .from('event_campuses')
      .select('event_id')
      .eq('campus_id', campusId)

    if (linksError) {
      console.error('Error fetching event campus links:', linksError)
      return new Response('Error fetching events', { status: 500 })
    }

    const eventIds = eventCampusLinks?.map((ec) => ec.event_id) || []

    // Create calendar
    const calendar = icalGenerator({
      name: `${church.name} - ${campus.name}`,
      timezone: 'UTC',
      prodId: { company: 'Koinonia', product: 'Church Calendar' },
    })

    if (eventIds.length === 0) {
      // No events for this campus, return empty calendar
      return new Response(calendar.toString(), {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="calendar.ics"`,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Fetch published events with visibility 'members' for this campus
    // Include events from the last 30 days to the future
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: events, error: eventsError } = await supabase
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
        location_id,
        locations (name, address)
      `
      )
      .in('id', eventIds)
      .eq('status', 'published')
      .eq('visibility', 'members')
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return new Response('Error fetching events', { status: 500 })
    }

    // Add events
    if (events) {
      for (const event of events) {
        // Handle location - it might be null or an object
        let locationStr: string | undefined
        if (event.locations && typeof event.locations === 'object') {
          const loc = event.locations as unknown as { name: string; address: string | null }
          locationStr = loc.address ? `${loc.name}, ${loc.address}` : loc.name
        }

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
        'Content-Disposition': `attachment; filename="calendar.ics"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Calendar API error:', error)
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}
