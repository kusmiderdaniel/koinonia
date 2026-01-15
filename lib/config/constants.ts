/**
 * Centralized configuration constants for the Koinonia application.
 * These values are used across the codebase for consistency.
 */

// =============================================================================
// TIMING & DURATIONS (in milliseconds)
// =============================================================================

/**
 * Duration to show feedback after copying something to clipboard
 */
export const COPY_FEEDBACK_DURATION = 2000

/**
 * Duration to show success messages before auto-dismissing
 */
export const SUCCESS_MESSAGE_DURATION = 3000

/**
 * Duration to show error messages before auto-dismissing
 */
export const ERROR_MESSAGE_DURATION = 5000

/**
 * Delay between batch operations to prevent rate limiting
 */
export const BATCH_OPERATION_DELAY = 1000

/**
 * Debounce delay for search inputs
 */
export const SEARCH_DEBOUNCE_DELAY = 300

/**
 * Debounce delay for auto-save operations
 */
export const AUTOSAVE_DEBOUNCE_DELAY = 500

// =============================================================================
// REACT QUERY CACHE TIMES
// =============================================================================

/**
 * Default stale time for data queries - data considered fresh for this duration
 */
export const DEFAULT_STALE_TIME = 60 * 1000 // 1 minute

/**
 * Short stale time for frequently changing data (e.g., real-time dashboards)
 */
export const SHORT_STALE_TIME = 30 * 1000 // 30 seconds

/**
 * Long stale time for rarely changing data (e.g., settings, user profiles)
 */
export const LONG_STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Default garbage collection time - how long unused data stays in cache
 */
export const DEFAULT_GC_TIME = 5 * 60 * 1000 // 5 minutes

// =============================================================================
// PAGINATION
// =============================================================================

/**
 * Default number of items per page in tables and lists
 */
export const DEFAULT_PAGE_SIZE = 25

/**
 * Page size options for tables
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

// =============================================================================
// FILE UPLOADS
// =============================================================================

/**
 * Maximum file size for image uploads (in bytes)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Maximum file size for document uploads (in bytes)
 */
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

// =============================================================================
// UI CONSTANTS
// =============================================================================

/**
 * Animation durations for UI transitions
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const

/**
 * Z-index layers for consistent stacking
 */
export const Z_INDEX = {
  dropdown: 50,
  sticky: 40,
  fixed: 30,
  overlay: 60,
  modal: 70,
  popover: 80,
  tooltip: 90,
} as const

// =============================================================================
// FORM VALIDATION
// =============================================================================

/**
 * Maximum lengths for common text fields
 */
export const MAX_FIELD_LENGTH = {
  name: 100,
  title: 200,
  description: 1000,
  shortText: 255,
  longText: 5000,
  email: 254,
  url: 2048,
} as const

/**
 * Minimum lengths for password validation
 */
export const MIN_PASSWORD_LENGTH = 8

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

/**
 * Maximum number of retry attempts for failed operations
 */
export const MAX_RETRY_ATTEMPTS = 3

/**
 * Base delay between retry attempts (in milliseconds)
 * Actual delay uses exponential backoff: baseDelay * 2^attemptNumber
 */
export const RETRY_BASE_DELAY = 1000

// =============================================================================
// DATE & TIME
// =============================================================================

/**
 * Default timezone for date operations (when user timezone is not available)
 */
export const DEFAULT_TIMEZONE = 'America/New_York'

/**
 * Date format for display
 */
export const DATE_FORMAT = {
  short: 'MMM d',
  medium: 'MMM d, yyyy',
  long: 'MMMM d, yyyy',
  iso: 'yyyy-MM-dd',
} as const

/**
 * Time format for display
 */
export const TIME_FORMAT = {
  short: 'h:mm a',
  long: 'h:mm:ss a',
  military: 'HH:mm',
} as const
