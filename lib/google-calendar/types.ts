/**
 * Google Calendar Integration Types
 */

// ============================================
// OAuth & Authentication
// ============================================

export interface GoogleOAuthTokens {
  access_token: string
  refresh_token: string
  expires_at: Date
  token_type: string
  scope: string
}

export interface GoogleUserInfo {
  email: string
  id: string
  name?: string
  picture?: string
}

// ============================================
// Connection Status
// ============================================

export type ConnectionStatus =
  | 'disconnected'    // Not connected
  | 'connected'       // Connected and working
  | 'requires_reauth' // Refresh token invalid, needs re-authorization
  | 'error'           // Other error state

export interface GoogleCalendarConnection {
  id: string
  profileId: string
  churchId: string
  googleEmail: string
  googleUserId: string | null
  status: ConnectionStatus
  isActive: boolean
  lastSyncAt: Date | null
  lastSyncError: string | null
  requiresReauth: boolean
  createdAt: Date
  updatedAt: Date
  // Calendar IDs
  churchCalendarGoogleId: string | null
  personalCalendarGoogleId: string | null
  // Sync preferences
  syncChurchCalendar: boolean
  syncPersonalCalendar: boolean
}

// ============================================
// Calendar Types
// ============================================

export type CalendarType = 'church' | 'campus' | 'personal'

export interface CalendarInfo {
  type: CalendarType
  googleCalendarId: string
  name: string
  description?: string
  syncEnabled: boolean
  campusId?: string // Only for campus type
  campusName?: string // Only for campus type
  campusColor?: string // Only for campus type
}

export interface CalendarPreferences {
  syncChurchCalendar: boolean
  syncPersonalCalendar: boolean
  campusCalendars: {
    campusId: string
    syncEnabled: boolean
  }[]
}

// ============================================
// Campus Calendar
// ============================================

export interface CampusCalendarSync {
  id: string
  connectionId: string
  campusId: string
  googleCalendarId: string
  syncEnabled: boolean
  createdAt: Date
}

// ============================================
// Event Sync
// ============================================

export interface SyncedEvent {
  id: string
  eventId: string
  connectionId: string
  calendarType: CalendarType
  campusId: string | null
  googleCalendarId: string
  googleEventId: string
  lastSyncedAt: Date
  eventHash: string | null
}

export interface EventSyncResult {
  success: boolean
  googleEventId?: string
  error?: string
}

// ============================================
// Google Calendar API Types
// ============================================

export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime?: string  // ISO 8601 format for timed events
    date?: string      // YYYY-MM-DD format for all-day events
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  colorId?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
}

export interface GoogleCalendarResource {
  id: string
  summary: string
  description?: string
  timeZone?: string
  colorId?: string
  backgroundColor?: string
  foregroundColor?: string
}

// ============================================
// API Response Types
// ============================================

export interface GoogleCalendarConnectionResponse {
  connection: GoogleCalendarConnection | null
  calendars: CalendarInfo[]
  availableCampuses: {
    id: string
    name: string
    color: string | null
  }[]
  /** Whether user can sync the church-wide public calendar (admins only) */
  canSyncChurchCalendar: boolean
}

export interface OAuthAuthorizeResponse {
  authUrl: string
}

export interface OAuthCallbackResult {
  success: boolean
  error?: string
  connection?: GoogleCalendarConnection
}

export interface DisconnectResult {
  success: boolean
  error?: string
}

export interface SyncResult {
  success: boolean
  syncedEvents: number
  errors: string[]
}

// ============================================
// Service Configuration
// ============================================

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',           // Full calendar access
  'https://www.googleapis.com/auth/userinfo.email',     // Get user's email
  'https://www.googleapis.com/auth/userinfo.profile',   // Get user's profile info
] as const

// ============================================
// Calendar Colors (Google's predefined colors)
// ============================================

// Google Calendar has a fixed set of 24 colors
// These are the color IDs that can be used
export const GOOGLE_CALENDAR_COLORS = {
  '1': '#a4bdfc', // Lavender
  '2': '#7ae7bf', // Sage
  '3': '#dbadff', // Grape
  '4': '#ff887c', // Flamingo
  '5': '#fbd75b', // Banana
  '6': '#ffb878', // Tangerine
  '7': '#46d6db', // Peacock
  '8': '#e1e1e1', // Graphite
  '9': '#5484ed', // Blueberry
  '10': '#51b749', // Basil
  '11': '#dc2127', // Tomato
} as const

// ============================================
// Error Types
// ============================================

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'GoogleCalendarError'
  }
}

export class TokenExpiredError extends GoogleCalendarError {
  constructor() {
    super('Access token has expired', 'TOKEN_EXPIRED', 401)
  }
}

export class RefreshTokenInvalidError extends GoogleCalendarError {
  constructor() {
    super('Refresh token is invalid. User needs to re-authorize.', 'REFRESH_TOKEN_INVALID', 401)
  }
}

export class RateLimitError extends GoogleCalendarError {
  constructor(public retryAfter?: number) {
    super('Google Calendar API rate limit exceeded', 'RATE_LIMIT', 429)
  }
}

export class CalendarNotFoundError extends GoogleCalendarError {
  constructor(calendarId: string) {
    super(`Calendar not found: ${calendarId}`, 'CALENDAR_NOT_FOUND', 404)
  }
}
