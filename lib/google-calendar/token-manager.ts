/**
 * Token Manager for Google Calendar Integration
 *
 * Handles:
 * - Token encryption/decryption
 * - Token refresh when expired
 * - Database operations for token storage
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'
import {
  createAuthenticatedOAuth2Client,
  createCalendarClient,
  isTokenExpired,
  refreshAccessToken,
} from './client'
import {
  GoogleCalendarConnection,
  RefreshTokenInvalidError,
  GoogleCalendarError,
} from './types'
import type { calendar_v3, Auth } from 'googleapis'

// Use the OAuth2Client type from googleapis to avoid type mismatches
type OAuth2Client = Auth.OAuth2Client

// ============================================
// Token Encryption/Decryption
// ============================================

export interface EncryptedTokens {
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
}

export interface DecryptedTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

/**
 * Encrypt OAuth tokens for storage in database.
 */
export function encryptTokens(
  accessToken: string,
  refreshToken: string
): EncryptedTokens {
  return {
    accessTokenEncrypted: encrypt(accessToken),
    refreshTokenEncrypted: encrypt(refreshToken),
  }
}

/**
 * Decrypt OAuth tokens from database.
 */
export function decryptTokens(
  accessTokenEncrypted: string,
  refreshTokenEncrypted: string,
  expiresAt: Date | string
): DecryptedTokens {
  return {
    accessToken: decrypt(accessTokenEncrypted),
    refreshToken: decrypt(refreshTokenEncrypted),
    expiresAt: new Date(expiresAt),
  }
}

// ============================================
// Connection Retrieval
// ============================================

/**
 * Get Google Calendar connection for a user by profile ID.
 */
export async function getConnectionByProfileId(
  profileId: string
): Promise<GoogleCalendarConnection | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('profile_id', profileId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null
    }
    throw new GoogleCalendarError(
      `Failed to get connection: ${error.message}`,
      'DB_ERROR'
    )
  }

  return mapConnectionFromDb(data)
}

/**
 * Get Google Calendar connection by ID.
 */
export async function getConnectionById(
  connectionId: string
): Promise<GoogleCalendarConnection | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('id', connectionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new GoogleCalendarError(
      `Failed to get connection: ${error.message}`,
      'DB_ERROR'
    )
  }

  return mapConnectionFromDb(data)
}

// ============================================
// Token Refresh Logic
// ============================================

/**
 * Get valid (non-expired) tokens for a connection.
 * Automatically refreshes if expired.
 */
export async function getValidTokens(
  connectionId: string
): Promise<DecryptedTokens> {
  const supabase = createServiceRoleClient()

  // Get connection from database
  const { data: connection, error } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('id', connectionId)
    .single()

  if (error || !connection) {
    throw new GoogleCalendarError(
      'Connection not found',
      'CONNECTION_NOT_FOUND',
      404
    )
  }

  if (connection.requires_reauth) {
    throw new RefreshTokenInvalidError()
  }

  // Decrypt tokens
  const tokens = decryptTokens(
    connection.access_token_encrypted,
    connection.refresh_token_encrypted,
    connection.token_expires_at
  )

  // Check if token is expired
  if (isTokenExpired(tokens.expiresAt.getTime())) {
    // Refresh the token
    try {
      const newTokens = await refreshAccessToken(tokens.refreshToken)

      // Update database with new access token
      const { accessTokenEncrypted } = encryptTokens(
        newTokens.access_token,
        tokens.refreshToken
      )

      const expiresAt = new Date(newTokens.expiry_date)

      const { error: updateError } = await supabase
        .from('google_calendar_connections')
        .update({
          access_token_encrypted: accessTokenEncrypted,
          token_expires_at: expiresAt.toISOString(),
          last_sync_error: null,
        })
        .eq('id', connectionId)

      if (updateError) {
        console.error('Failed to update tokens in database:', updateError)
      }

      return {
        accessToken: newTokens.access_token,
        refreshToken: tokens.refreshToken,
        expiresAt,
      }
    } catch (err) {
      // Refresh token is invalid - mark connection as requiring reauth
      await markConnectionRequiresReauth(connectionId, err instanceof Error ? err.message : 'Token refresh failed')
      throw new RefreshTokenInvalidError()
    }
  }

  return tokens
}

/**
 * Get an authenticated Google Calendar client for a connection.
 * Handles token refresh automatically.
 */
export async function getAuthenticatedClient(
  connectionId: string
): Promise<{
  auth: OAuth2Client
  calendar: calendar_v3.Calendar
  tokens: DecryptedTokens
}> {
  const tokens = await getValidTokens(connectionId)

  const auth = createAuthenticatedOAuth2Client({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt.getTime(),
  })

  const calendar = createCalendarClient(auth)

  return { auth, calendar, tokens }
}

// ============================================
// Connection Status Updates
// ============================================

/**
 * Mark a connection as requiring re-authorization.
 */
export async function markConnectionRequiresReauth(
  connectionId: string,
  error?: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error: updateError } = await supabase
    .from('google_calendar_connections')
    .update({
      requires_reauth: true,
      is_active: false,
      last_sync_error: error || 'Refresh token invalid - re-authorization required',
    })
    .eq('id', connectionId)

  if (updateError) {
    console.error('Failed to mark connection as requiring reauth:', updateError)
  }
}

/**
 * Update last sync timestamp and clear errors.
 */
export async function updateLastSync(connectionId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  await supabase
    .from('google_calendar_connections')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq('id', connectionId)
}

/**
 * Update connection with sync error.
 */
export async function updateSyncError(
  connectionId: string,
  error: string
): Promise<void> {
  const supabase = createServiceRoleClient()

  await supabase
    .from('google_calendar_connections')
    .update({
      last_sync_error: error,
    })
    .eq('id', connectionId)
}

// ============================================
// Connection CRUD
// ============================================

/**
 * Create a new Google Calendar connection.
 */
export async function createConnection(params: {
  profileId: string
  churchId: string
  googleEmail: string
  googleUserId: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
}): Promise<GoogleCalendarConnection> {
  const supabase = createServiceRoleClient()

  const { accessTokenEncrypted, refreshTokenEncrypted } = encryptTokens(
    params.accessToken,
    params.refreshToken
  )

  const { data, error } = await supabase
    .from('google_calendar_connections')
    .upsert(
      {
        profile_id: params.profileId,
        church_id: params.churchId,
        google_email: params.googleEmail,
        google_user_id: params.googleUserId,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        token_expires_at: params.expiresAt.toISOString(),
        is_active: true,
        requires_reauth: false,
        sync_church_calendar: false,
        sync_personal_calendar: false,
      },
      {
        onConflict: 'profile_id',
      }
    )
    .select()
    .single()

  if (error) {
    throw new GoogleCalendarError(
      `Failed to create connection: ${error.message}`,
      'DB_ERROR'
    )
  }

  return mapConnectionFromDb(data)
}

/**
 * Delete a Google Calendar connection.
 */
export async function deleteConnection(connectionId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  // Delete will cascade to campus_calendars and synced_events
  const { error } = await supabase
    .from('google_calendar_connections')
    .delete()
    .eq('id', connectionId)

  if (error) {
    throw new GoogleCalendarError(
      `Failed to delete connection: ${error.message}`,
      'DB_ERROR'
    )
  }
}

/**
 * Update connection preferences.
 */
export async function updateConnectionPreferences(
  connectionId: string,
  preferences: {
    syncChurchCalendar?: boolean
    syncPersonalCalendar?: boolean
  }
): Promise<void> {
  const supabase = createServiceRoleClient()

  const updates: Record<string, boolean> = {}

  if (preferences.syncChurchCalendar !== undefined) {
    updates.sync_church_calendar = preferences.syncChurchCalendar
  }

  if (preferences.syncPersonalCalendar !== undefined) {
    updates.sync_personal_calendar = preferences.syncPersonalCalendar
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  const { error } = await supabase
    .from('google_calendar_connections')
    .update(updates)
    .eq('id', connectionId)

  if (error) {
    throw new GoogleCalendarError(
      `Failed to update preferences: ${error.message}`,
      'DB_ERROR'
    )
  }
}

// ============================================
// Helper Functions
// ============================================

interface DbConnection {
  id: string
  profile_id: string
  church_id: string
  google_email: string
  google_user_id: string | null
  access_token_encrypted: string
  refresh_token_encrypted: string
  token_expires_at: string
  church_calendar_google_id: string | null
  personal_calendar_google_id: string | null
  sync_church_calendar: boolean
  sync_personal_calendar: boolean
  is_active: boolean
  last_sync_at: string | null
  last_sync_error: string | null
  requires_reauth: boolean
  created_at: string
  updated_at: string
}

function mapConnectionFromDb(data: DbConnection): GoogleCalendarConnection {
  return {
    id: data.id,
    profileId: data.profile_id,
    churchId: data.church_id,
    googleEmail: data.google_email,
    googleUserId: data.google_user_id,
    status: data.requires_reauth
      ? 'requires_reauth'
      : data.is_active
        ? 'connected'
        : 'error',
    isActive: data.is_active,
    lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : null,
    lastSyncError: data.last_sync_error,
    requiresReauth: data.requires_reauth,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    churchCalendarGoogleId: data.church_calendar_google_id,
    personalCalendarGoogleId: data.personal_calendar_google_id,
    syncChurchCalendar: data.sync_church_calendar,
    syncPersonalCalendar: data.sync_personal_calendar,
  }
}
