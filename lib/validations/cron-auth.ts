import { NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Result of cron authentication verification
 */
interface CronAuthResult {
  authorized: boolean
  error?: NextResponse
}

/**
 * Performs timing-safe comparison of the CRON_SECRET
 *
 * Uses crypto.timingSafeEqual to prevent timing attacks that could
 * allow an attacker to gradually guess the secret byte by byte.
 *
 * @param authHeader - The Authorization header from the request
 * @returns CronAuthResult indicating if authorized, with error response if not
 */
export function verifyCronSecret(authHeader: string | null): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET

  // CRITICAL: Fail closed - if CRON_SECRET is not configured, deny all access
  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET environment variable is not configured')
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    }
  }

  // Check if auth header exists
  if (!authHeader) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // Extract the token from "Bearer <token>"
  const expectedToken = `Bearer ${cronSecret}`

  // Use timing-safe comparison to prevent timing attacks
  // Both strings must be the same length for timingSafeEqual
  // If lengths differ, we still do a comparison to prevent length-based timing attacks
  const authBuffer = Buffer.from(authHeader)
  const expectedBuffer = Buffer.from(expectedToken)

  // If lengths don't match, create a buffer of the same length to compare
  // This ensures we don't leak length information through timing
  const isLengthMatch = authBuffer.length === expectedBuffer.length

  let isMatch: boolean
  if (isLengthMatch) {
    isMatch = crypto.timingSafeEqual(authBuffer, expectedBuffer)
  } else {
    // Compare with a buffer of the same length as authBuffer
    // This prevents length-based timing attacks
    const compareBuffer = Buffer.alloc(authBuffer.length)
    crypto.timingSafeEqual(authBuffer, compareBuffer)
    isMatch = false
  }

  if (!isMatch) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { authorized: true }
}
