/**
 * Pagination constants used throughout the application.
 */

/**
 * Default page sizes for various list views
 */
export const PAGE_SIZE = {
  /** Default page size for table views */
  DEFAULT: 25,
  /** Small page size for compact lists */
  SMALL: 10,
  /** Large page size for expanded views */
  LARGE: 50,
  /** Maximum items to load at once */
  MAX: 100,
} as const

/**
 * Limits for various queries
 */
export const QUERY_LIMIT = {
  /** Notifications list */
  NOTIFICATIONS: 100,
  /** Search results autocomplete */
  AUTOCOMPLETE: 10,
  /** Recent items lists */
  RECENT: 5,
  /** Dashboard preview items */
  DASHBOARD_PREVIEW: 6,
} as const
