/**
 * Token validation utilities for secure token handling
 *
 * Token formats used in the application:
 * - nanoid(32): 32 characters, URL-safe alphabet (A-Za-z0-9_-)
 * - crypto.randomBytes(32).toString('base64url'): 43 characters, base64url
 */

// Minimum token length - our tokens are 32+ characters
const MIN_TOKEN_LENGTH = 32

// Maximum token length - base64url of 32 bytes is 43 chars, allow some buffer
const MAX_TOKEN_LENGTH = 64

// Valid characters for nanoid tokens (URL-safe alphabet)
const NANOID_REGEX = /^[A-Za-z0-9_-]+$/

// Valid characters for base64url tokens
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/

/**
 * Validates a token string for proper format and length
 *
 * @param token - The token string to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateToken(token: string | null | undefined): {
  isValid: boolean
  error?: string
} {
  if (!token) {
    return { isValid: false, error: 'Token is required' }
  }

  if (typeof token !== 'string') {
    return { isValid: false, error: 'Token must be a string' }
  }

  if (token.length < MIN_TOKEN_LENGTH) {
    return { isValid: false, error: 'Token is too short' }
  }

  if (token.length > MAX_TOKEN_LENGTH) {
    return { isValid: false, error: 'Token is too long' }
  }

  // Check for valid characters (both nanoid and base64url use same alphabet)
  if (!NANOID_REGEX.test(token)) {
    return { isValid: false, error: 'Token contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Quick validation check - returns boolean only
 *
 * @param token - The token string to validate
 * @returns true if token is valid, false otherwise
 */
export function isValidToken(token: string | null | undefined): token is string {
  return validateToken(token).isValid
}

/**
 * Constants for token validation
 */
export const TOKEN_VALIDATION = {
  MIN_LENGTH: MIN_TOKEN_LENGTH,
  MAX_LENGTH: MAX_TOKEN_LENGTH,
  PATTERN: NANOID_REGEX,
} as const
