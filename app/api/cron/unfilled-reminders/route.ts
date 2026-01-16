import { NextResponse } from 'next/server'
import { sendUnfilledPositionReminders } from '@/lib/notifications/unfilled-reminder'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'
import { verifyCronSecret } from '@/lib/validations/cron-auth'

/**
 * Cron job endpoint for sending unfilled position reminders.
 * Should be called daily by Vercel Cron.
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
    console.log('[Cron] Starting unfilled positions reminder job...')

    const result = await sendUnfilledPositionReminders()

    console.log('[Cron] Unfilled reminders job completed:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Cron] Unfilled reminders job failed:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
