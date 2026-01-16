/**
 * Google Calendar OAuth Authorization Endpoint
 *
 * GET /api/integrations/google-calendar/authorize
 *
 * Initiates the OAuth flow by redirecting the user to Google's consent screen.
 * Returns the authorization URL for the client to redirect to.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAuthUrl } from '@/lib/google-calendar/client'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile to verify they belong to a church
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, church_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!profile.church_id) {
      return NextResponse.json(
        { error: 'User is not associated with a church' },
        { status: 400 }
      )
    }

    // Generate a state parameter for CSRF protection
    // State contains profile_id encrypted/encoded to verify on callback
    const state = nanoid(32)

    // Store state in a cookie for verification on callback
    // The state will be verified when Google redirects back
    const response = NextResponse.json({
      authUrl: generateAuthUrl(state),
    })

    // Set state cookie (httpOnly, secure in production)
    response.cookies.set('gc_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    // Also store profile_id in cookie for callback
    response.cookies.set('gc_oauth_profile', profile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Google Calendar authorize error:', error)

    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
