import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

/**
 * Rate Limiting Configuration
 *
 * Uses Upstash Redis in production (recommended for serverless).
 * Falls back to in-memory rate limiting for development.
 *
 * To enable Upstash in production, set these environment variables:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// Check if Upstash is configured
const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// In-memory store for development (not suitable for production serverless)
const inMemoryStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limit configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // Strict: For sensitive endpoints like auth, password reset
  strict: { requests: 5, window: '1 m' as const },
  // Standard: For general API endpoints
  standard: { requests: 20, window: '1 m' as const },
  // Relaxed: For public read endpoints
  relaxed: { requests: 60, window: '1 m' as const },
  // Very strict: For token-based endpoints to prevent brute force
  token: { requests: 10, window: '15 m' as const },
  // Cron: For cron job endpoints
  cron: { requests: 5, window: '1 m' as const },
} as const

type RateLimitConfig = keyof typeof rateLimitConfigs

/**
 * Create an Upstash rate limiter instance
 */
function createUpstashRateLimiter(config: RateLimitConfig) {
  const { requests, window } = rateLimitConfigs[config]

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `ratelimit:${config}`,
  })
}

/**
 * In-memory rate limiter for development
 * Note: This won't work correctly in serverless environments
 */
function checkInMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const { requests, window } = rateLimitConfigs[config]
  const windowMs = parseWindow(window)
  const now = Date.now()
  const key = `${config}:${identifier}`

  const record = inMemoryStore.get(key)

  if (!record || now > record.resetTime) {
    // First request or window expired
    inMemoryStore.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: requests - 1, reset: now + windowMs }
  }

  if (record.count >= requests) {
    // Rate limit exceeded
    return { success: false, remaining: 0, reset: record.resetTime }
  }

  // Increment counter
  record.count++
  return {
    success: true,
    remaining: requests - record.count,
    reset: record.resetTime,
  }
}

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/)
  if (!match) return 60000 // Default 1 minute

  const [, value, unit] = match
  const num = parseInt(value, 10)

  switch (unit) {
    case 's':
      return num * 1000
    case 'm':
      return num * 60 * 1000
    case 'h':
      return num * 60 * 60 * 1000
    case 'd':
      return num * 24 * 60 * 60 * 1000
    default:
      return 60000
  }
}

/**
 * Get client identifier from request
 * Uses IP address, falling back to a default for development
 */
export function getClientIdentifier(request: Request): string {
  // Try various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Vercel-specific header
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    return vercelIp.split(',')[0].trim()
  }

  // Fallback for development
  return 'development-client'
}

/**
 * Rate limit result type
 */
export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

/**
 * Check rate limit for a request
 *
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration to use
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = 'standard'
): Promise<RateLimitResult> {
  const { requests } = rateLimitConfigs[config]

  if (isUpstashConfigured) {
    // Use Upstash in production
    const limiter = createUpstashRateLimiter(config)
    const result = await limiter.limit(identifier)

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: requests,
    }
  }

  // Fall back to in-memory for development
  const result = checkInMemoryRateLimit(identifier, config)
  return {
    ...result,
    limit: requests,
  }
}

/**
 * Create a rate-limited response with appropriate headers
 */
export function rateLimitedResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  )
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return response
}

/**
 * Higher-order function to wrap an API route with rate limiting
 *
 * @example
 * export const GET = withRateLimit(async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ data: 'success' })
 * }, 'standard')
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse> | NextResponse,
  config: RateLimitConfig = 'standard'
) {
  return async (request: Request): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request)
    const result = await checkRateLimit(identifier, config)

    if (!result.success) {
      return rateLimitedResponse(result)
    }

    const response = await handler(request)
    return addRateLimitHeaders(response, result)
  }
}
