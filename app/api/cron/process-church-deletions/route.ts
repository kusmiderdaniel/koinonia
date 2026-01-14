import { NextResponse } from 'next/server'
import { processChurchDeletions } from '@/lib/cron/process-church-deletions'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

/**
 * Cron job endpoint for processing church deletions.
 * Should be called daily by Vercel Cron.
 *
 * Processes DPA/Admin Terms disagreements past their deadline (30 days after effective date).
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

  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // CRITICAL: Fail closed - if CRON_SECRET is not configured, deny all access
  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET environment variable is not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Verify the authorization header matches the secret
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Cron] Starting church deletions job...')

    const result = await processChurchDeletions()

    console.log('[Cron] Church deletions job completed:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Cron] Church deletions job failed:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
