import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ token: string }>
}

// POST - Record analytics event for public form
export async function POST(request: Request, context: RouteContext) {
  // Rate limit - relaxed for analytics events
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const { token } = await context.params
    const body = await request.json()
    const { eventType, sessionId, deviceType } = body

    // Validate event type
    if (!['view', 'start', 'submit'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    // Get form by public token
    const { data: form, error: formError } = await adminClient
      .from('forms')
      .select('id')
      .eq('public_token', token)
      .eq('access_type', 'public')
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
