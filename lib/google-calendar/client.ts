/**
 * Google Calendar API Client Factory
 *
 * Creates authenticated Google Calendar API clients for making API calls.
 */

import { google, calendar_v3, Auth } from 'googleapis'
import { GOOGLE_CALENDAR_SCOPES, GoogleCalendarConfig } from './types'

// Use the OAuth2Client type from googleapis to avoid type mismatches
type OAuth2Client = Auth.OAuth2Client

// ============================================
// Configuration
// ============================================

/**
 * Get Google OAuth configuration from environment variables.
 */
export function getGoogleCalendarConfig(): GoogleCalendarConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Google OAuth configuration. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    )
  }

  return {
    clientId,
    clientSecret,
    redirectUri: `${baseUrl}/api/integrations/google-calendar/callback`,
    scopes: [...GOOGLE_CALENDAR_SCOPES],
  }
}

// ============================================
// OAuth2 Client Factory
// ============================================

/**
 * Create a new OAuth2 client without authentication.
 * Used for generating auth URLs and exchanging codes for tokens.
 */
export function createOAuth2Client(): OAuth2Client {
  const config = getGoogleCalendarConfig()

  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  )
}

/**
 * Create an authenticated OAuth2 client with tokens.
 * Used for making authenticated API calls.
 */
export function createAuthenticatedOAuth2Client(tokens: {
  access_token: string
  refresh_token: string
  expiry_date?: number
}): OAuth2Client {
  const client = createOAuth2Client()

  client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  })

  return client
}

// ============================================
// Calendar API Client Factory
// ============================================

/**
 * Create a Google Calendar API client with authentication.
 */
export function createCalendarClient(auth: OAuth2Client): calendar_v3.Calendar {
  return google.calendar({ version: 'v3', auth })
}

/**
 * Create both OAuth2 client and Calendar client in one call.
 * Convenience function for most use cases.
 */
export function createGoogleCalendarClient(tokens: {
  access_token: string
  refresh_token: string
  expiry_date?: number
}): {
  auth: OAuth2Client
  calendar: calendar_v3.Calendar
} {
  const auth = createAuthenticatedOAuth2Client(tokens)
  const calendar = createCalendarClient(auth)

  return { auth, calendar }
}

// ============================================
// OAuth URL Generation
// ============================================

/**
 * Generate the Google OAuth authorization URL.
 *
 * @param state - Optional state parameter for CSRF protection
 * @returns The authorization URL to redirect the user to
 */
export function generateAuthUrl(state?: string): string {
  const client = createOAuth2Client()
  const config = getGoogleCalendarConfig()

  return client.generateAuthUrl({
    access_type: 'offline',       // Get refresh token
    prompt: 'consent',            // Always show consent screen to get refresh token
    scope: config.scopes,
    state: state,
    include_granted_scopes: true, // Incremental authorization
  })
}

/**
 * Exchange authorization code for tokens.
 *
 * @param code - The authorization code from OAuth callback
 * @returns The OAuth tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expiry_date: number
  scope: string
  token_type: string
}> {
  const client = createOAuth2Client()

  const { tokens } = await client.getToken(code)

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to get tokens from Google. Missing access_token or refresh_token.')
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
    scope: tokens.scope || '',
    token_type: tokens.token_type || 'Bearer',
  }
}

// ============================================
// User Info
// ============================================

/**
 * Get the authenticated user's Google account info.
 */
export async function getGoogleUserInfo(auth: OAuth2Client): Promise<{
  email: string
  id: string
  name?: string
  picture?: string
}> {
  const oauth2 = google.oauth2({ version: 'v2', auth })

  const { data } = await oauth2.userinfo.get()

  if (!data.email || !data.id) {
    throw new Error('Failed to get user info from Google')
  }

  return {
    email: data.email,
    id: data.id,
    name: data.name || undefined,
    picture: data.picture || undefined,
  }
}

// ============================================
// Token Validation
// ============================================

/**
 * Check if access token is expired or about to expire.
 *
 * @param expiryDate - Token expiry timestamp in milliseconds
 * @param bufferMs - Buffer time before expiry (default 5 minutes)
 * @returns True if token is expired or will expire within buffer time
 */
export function isTokenExpired(expiryDate: number, bufferMs: number = 5 * 60 * 1000): boolean {
  return Date.now() >= expiryDate - bufferMs
}

/**
 * Refresh the access token using the refresh token.
 *
 * @param refreshToken - The refresh token
 * @returns New tokens
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expiry_date: number
}> {
  const client = createOAuth2Client()

  client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await client.refreshAccessToken()

  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token')
  }

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
  }
}
