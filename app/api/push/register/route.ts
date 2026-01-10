import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'
import { z } from 'zod'

const registerSchema = z.object({
  token: z.string().min(1),
  deviceId: z.string().min(1),
  deviceName: z.string().optional(),
  platform: z.enum(['web', 'ios', 'android']).default('web'),
})

export async function POST(request: Request) {
  // Rate limit
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'standard')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    // Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { token, deviceId, deviceName, platform } = parsed.data
    const adminClient = createServiceRoleClient()

    // Get user's profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, church_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Upsert push token (update if device_id exists, insert otherwise)
    const { error: upsertError } = await adminClient.from('push_tokens').upsert(
      {
        profile_id: profile.id,
        church_id: profile.church_id,
        token,
        device_id: deviceId,
        device_name: deviceName || null,
        platform,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'profile_id,device_id',
      }
    )

    if (upsertError) {
      console.error('[Push] Failed to register token:', upsertError)
      return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Push] Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'standard')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { error: deleteError } = await adminClient
      .from('push_tokens')
      .delete()
      .eq('profile_id', profile.id)
      .eq('device_id', deviceId)

    if (deleteError) {
      console.error('[Push] Failed to delete token:', deleteError)
      return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Push] Delete token error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
