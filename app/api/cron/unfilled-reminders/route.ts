import { NextResponse } from 'next/server'
import { sendUnfilledPositionReminders } from '@/lib/notifications/unfilled-reminder'

/**
 * Cron job endpoint for sending unfilled position reminders.
 * Should be called daily by Vercel Cron.
 *
 * Security: Protected by CRON_SECRET environment variable.
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
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
