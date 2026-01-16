import { NextResponse } from 'next/server'
import { sendChurchDeletionWarnings } from '@/lib/cron/send-church-deletion-warnings'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'
import { verifyCronSecret } from '@/lib/validations/cron-auth'

/**
 * Cron job endpoint for sending church deletion warning emails.
 * Should be called daily by Vercel Cron.
 *
 * Sends warning emails to church members 10 days before their church is deleted
 * due to the owner's disagreement with DPA/Admin Terms.
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
    console.log('[Cron] Starting church deletion warnings job...')

    const result = await sendChurchDeletionWarnings()

    console.log('[Cron] Church deletion warnings job completed:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Cron] Church deletion warnings job failed:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
