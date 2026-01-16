import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'
import { isValidToken } from '@/lib/validations/token'
import { z } from 'zod'

const analyticsEventSchema = z.object({
  eventType: z.enum(['view', 'start', 'submit']),
  sessionId: z.string().min(1, 'Session ID is required'),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional().nullable(),
})

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

    // Validate token format
    if (!isValidToken(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const body = await request.json()

    // Validate request body with Zod
    const parseResult = analyticsEventSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { eventType, sessionId, deviceType } = parseResult.data

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
