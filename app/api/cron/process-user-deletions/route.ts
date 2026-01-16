import { NextResponse } from 'next/server'
import { processUserDeletions } from '@/lib/cron/process-user-deletions'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'
import { verifyCronSecret } from '@/lib/validations/cron-auth'

/**
 * Cron job endpoint for processing user account deletions.
 * Should be called daily by Vercel Cron.
 *
 * Processes ToS/Privacy Policy disagreements past their deadline (14 days after effective date).
 *
 * Security: Protected by CRON_SECRET environment variable and rate limiting.
 */
export async function GET(request: Request) {
  // Rate limit to prevent abuse
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'cron')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  // Verify cron secret using timing-safe comparison
  const authResult = verifyCronSecret(request.headers.get('authorization'))
  if (!authResult.authorized) {
    return authResult.error
  }

  try {
    console.log('[Cron] Starting user deletions job...')

    const result = await processUserDeletions()

    console.log('[Cron] User deletions job completed:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Cron] User deletions job failed:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
