/**
 * Google Calendar OAuth Callback Endpoint
 *
 * GET /api/integrations/google-calendar/callback
 *
 * Handles the OAuth callback from Google:
 * 1. Verifies the state parameter (CSRF protection)
 * 2. Exchanges the authorization code for tokens
 * 3. Gets user info from Google
 * 4. Creates/updates the connection in database
 * 5. Redirects back to the calendar integration page
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import {
  exchangeCodeForTokens,
  createAuthenticatedOAuth2Client,
  getGoogleUserInfo,
} from '@/lib/google-calendar/client'
import { createConnection } from '@/lib/google-calendar/token-manager'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectUrl = `${baseUrl}/dashboard/calendar-integration`

  // Handle OAuth errors from Google
  if (error) {
    console.error('Google OAuth error:', error)
    const errorDescription = searchParams.get('error_description') || 'Authorization was denied'
    return NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent(errorDescription)}`
    )
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent('Missing authorization code')}`
    )
  }

  // Verify state parameter (CSRF protection)
  const storedState = request.cookies.get('gc_oauth_state')?.value
  const storedProfileId = request.cookies.get('gc_oauth_profile')?.value

  if (!storedState || !storedProfileId) {
    return NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent('Session expired. Please try again.')}`
    )
  }

  if (state !== storedState) {
    return NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent('Invalid state parameter. Please try again.')}`
    )
  }

  try {
    // Verify user is still authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('Not authenticated')}`
      )
    }

    // Get profile and verify it matches the stored profile_id
    const adminClient = createServiceRoleClient()
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, church_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('Profile not found')}`
      )
    }

    if (profile.id !== storedProfileId) {
      return NextResponse.redirect(
        `${redirectUrl}?error=${encodeURIComponent('Profile mismatch. Please try again.')}`
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get user info from Google
    const auth = createAuthenticatedOAuth2Client({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    })

    const googleUserInfo = await getGoogleUserInfo(auth)

    // Create or update the connection
    // Note: No calendars are created automatically - user must toggle them manually
    await createConnection({
      profileId: profile.id,
      churchId: profile.church_id,
      googleEmail: googleUserInfo.email,
      googleUserId: googleUserInfo.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date),
    })

    // Clear OAuth cookies and redirect to success
    const response = NextResponse.redirect(`${redirectUrl}?success=true`)

    response.cookies.delete('gc_oauth_state')
    response.cookies.delete('gc_oauth_profile')

    return response
  } catch (err) {
    console.error('Google Calendar callback error:', err)

    const errorMessage = err instanceof Error ? err.message : 'Failed to connect Google Calendar'

    // Clear OAuth cookies on error
    const response = NextResponse.redirect(
      `${redirectUrl}?error=${encodeURIComponent(errorMessage)}`
    )

    response.cookies.delete('gc_oauth_state')
    response.cookies.delete('gc_oauth_profile')

    return response
  }
}
