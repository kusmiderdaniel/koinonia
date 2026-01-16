/**
 * Timing constants used throughout the application.
 * Centralizing these makes it easier to tune performance and maintain consistency.
 */

/**
 * Debounce delays for search inputs (in milliseconds)
 */
export const DEBOUNCE = {
  /** Standard search input debounce - used for most search fields */
  SEARCH: 300,
  /** Fast debounce for real-time validation */
  VALIDATION: 150,
  /** Slower debounce for expensive operations */
  EXPENSIVE: 500,
} as const

/**
 * Timeout values for various operations (in milliseconds)
 */
export const TIMEOUT = {
  /** Toast/notification auto-dismiss */
  TOAST: 5000,
  /** Loading state before showing skeleton */
  LOADING_DELAY: 200,
  /** API request timeout */
  API_REQUEST: 30000,
} as const

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION = {
  /** Fast transitions (hover, focus states) */
  FAST: 150,
  /** Standard transitions */
  NORMAL: 200,
  /** Slow transitions (page transitions, modals) */
  SLOW: 300,
} as const
