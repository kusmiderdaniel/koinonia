import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST - Record analytics event for internal form
export async function POST(request: Request, context: RouteContext) {
  // Rate limit - relaxed for analytics events
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const { id: formId } = await context.params
    const body = await request.json()
    const { eventType, sessionId, deviceType } = body

    // Validate event type
    if (!['view', 'start', 'submit'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Use service role client to bypass RLS for inserting analytics
    const adminClient = createServiceRoleClient()

    // Verify form exists
    const { data: form, error: formError } = await adminClient
      .from('forms')
      .select('id')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Record analytics event
    const { error: insertError } = await adminClient
      .from('form_analytics_events')
      .insert({
        form_id: form.id,
        event_type: eventType,
        session_id: sessionId,
        device_type: deviceType || null,
      })

    if (insertError) {
      console.error('Error recording analytics event:', insertError)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording analytics:', error)
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }
}

// GET - Get analytics data (requires authentication)
export async function GET(request: Request, context: RouteContext) {
  // Rate limit - relaxed for read operations
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const { id: formId } = await context.params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this form's analytics
    const { data: profile } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['owner', 'admin', 'leader'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify form belongs to user's church
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, church_id')
      .eq('id', formId)
      .eq('church_id', profile.church_id)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Get URL params for date range
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Use service role to get analytics (RLS policies apply)
    const adminClient = createServiceRoleClient()

    // Get event counts
    const { data: events, error: eventsError } = await adminClient
      .from('form_analytics_events')
      .select('event_type, device_type, created_at')
      .eq('form_id', formId)
      .gte('created_at', startDate.toISOString())

    if (eventsError) {
      console.error('Error fetching analytics:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Get submission count
    const { count: submissionCount } = await adminClient
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId)
      .gte('submitted_at', startDate.toISOString())

    // Aggregate data
    const views = events?.filter((e) => e.event_type === 'view').length || 0
    const starts = events?.filter((e) => e.event_type === 'start').length || 0
    const submissions = submissionCount || 0
    const completionRate = starts > 0 ? Math.round((submissions / starts) * 100) : 0

    // Device breakdown
    const deviceBreakdown = {
      desktop: events?.filter((e) => e.device_type === 'desktop').length || 0,
      mobile: events?.filter((e) => e.device_type === 'mobile').length || 0,
      tablet: events?.filter((e) => e.device_type === 'tablet').length || 0,
    }

    // Daily counts for charts
    const dailyCounts: Record<string, { views: number; starts: number; submissions: number }> = {}
    events?.forEach((e) => {
      const date = e.created_at.split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { views: 0, starts: 0, submissions: 0 }
      }
      if (e.event_type === 'view') dailyCounts[date].views++
      if (e.event_type === 'start') dailyCounts[date].starts++
    })

    // Get submissions by date
    const { data: submissionsByDate } = await adminClient
      .from('form_submissions')
      .select('submitted_at')
      .eq('form_id', formId)
      .gte('submitted_at', startDate.toISOString())

    submissionsByDate?.forEach((s) => {
      const date = s.submitted_at.split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { views: 0, starts: 0, submissions: 0 }
      }
      dailyCounts[date].submissions++
    })

    // Convert to sorted array
    const timeline = Object.entries(dailyCounts)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      totals: {
        views,
        starts,
        submissions,
        completionRate,
      },
      deviceBreakdown,
      timeline,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
