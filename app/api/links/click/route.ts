import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limit - relaxed for click tracking
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const body = await request.json()
    const { linkId, churchId } = body

    if (!linkId || !churchId) {
      return NextResponse.json(
        { error: 'Missing required fields: linkId and churchId' },
        { status: 400 }
      )
    }

    // Get request metadata
    const headersList = await headers()
    const userAgent = headersList.get('user-agent')
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : null
    const referrer = headersList.get('referer')

    const adminClient = createServiceRoleClient()

    // Verify link exists and belongs to the church
    const { data: link, error: linkError } = await adminClient
      .from('link_tree_links')
      .select('id')
      .eq('id', linkId)
      .eq('church_id', churchId)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      )
    }

    // Record the click
    const { error: insertError } = await adminClient
      .from('link_tree_clicks')
      .insert({
        link_id: linkId,
        church_id: churchId,
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
