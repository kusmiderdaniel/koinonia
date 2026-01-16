import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'
import { z } from 'zod'

const clickTrackingSchema = z.object({
  linkId: z.string().uuid('Invalid link ID format'),
})

export async function POST(request: Request) {
  // Rate limit - relaxed for click tracking
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const body = await request.json()

    // Validate request body with Zod
    const parseResult = clickTrackingSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { linkId } = parseResult.data

    // Get request metadata
    const headersList = await headers()
    const userAgent = headersList.get('user-agent')
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : null
    const referrer = headersList.get('referer')

    const adminClient = createServiceRoleClient()

    // Verify link exists and get its church_id from database (don't trust client input)
    const { data: link, error: linkError } = await adminClient
      .from('link_tree_links')
      .select('id, church_id')
      .eq('id', linkId)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      )
    }

    // Record the click using the database-sourced church_id
    const { error: insertError } = await adminClient
      .from('link_tree_clicks')
      .insert({
        link_id: linkId,
        church_id: link.church_id,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
      })

    if (insertError) {
      console.error('Error recording click:', insertError)
      return NextResponse.json(
        { error: 'Failed to record click' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Click tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
