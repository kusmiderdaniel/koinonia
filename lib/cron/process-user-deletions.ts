/**
 * @module lib/cron/process-user-deletions
 * @description Handles automated user account deletion for GDPR/ToS compliance.
 *
 * This cron job processes individual user accounts that have been scheduled for
 * deletion due to legal disagreements (e.g., ToS rejection, Privacy Policy
 * disagreement). It runs daily to find and process deletions past their deadline.
 *
 * @workflow
 * 1. Find all legal_disagreements with type 'user_deletion', status 'pending', past deadline
 * 2. For each disagreement:
 *    - Anonymize the user's profile data (preserves audit trail)
 *    - Delete the user from Supabase Auth
 *    - Update the disagreement status to 'completed'
 *
 * @gdpr-compliance
 * - Anonymizes profile data before deletion (first_name: 'Deleted', last_name: 'User')
 * - Removes PII (avatar_url, phone, address)
 * - Auth deletion cascades to remove user session data
 *
 * @database-tables
 * - legal_disagreements: Original disagreement records
 * - profiles: User profiles to anonymize
 * - auth.users: Supabase Auth records to delete
 *
 * @schedule Runs daily via Vercel Cron
 * @see /app/api/cron/process-user-deletions/route.ts
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Result of processing user deletions
 */
interface ProcessUserDeletionsResult {
  /** Number of disagreements found and processed */
  processed: number
  /** Number of user accounts successfully deleted */
  deleted: number
  /** Number of errors encountered during processing */
  errors: number
}

/**
 * Process pending user deletions for ToS/Privacy Policy disagreements.
 *
 * This function finds all user deletion disagreements that are past their deadline
 * and processes them by anonymizing profile data and deleting the auth account.
 *
 * @returns {Promise<ProcessUserDeletionsResult>} Results of the deletion processing
 *
 * @example
 * // Called from the cron API route
 * const result = await processUserDeletions()
 * // { processed: 5, deleted: 5, errors: 0 }
 *
 * @throws Never throws - errors are caught and logged, returned in result.errors
 */
export async function processUserDeletions(): Promise<ProcessUserDeletionsResult> {
  const adminClient = createServiceRoleClient()
  const now = new Date().toISOString()

  let processed = 0
  let deleted = 0
  let errors = 0

  // Find pending user deletions past their deadline
  const { data: pendingDeletions, error: fetchError } = await adminClient
    .from('legal_disagreements')
    .select(`
      id,
      user_id,
      profile_id,
      document_type
    `)
    .eq('status', 'pending')
    .eq('disagreement_type', 'user_deletion')
    .lt('deadline_at', now)

  if (fetchError) {
    console.error('[Cron:UserDeletions] Error fetching pending deletions:', fetchError)
    return { processed: 0, deleted: 0, errors: 1 }
  }

  if (!pendingDeletions || pendingDeletions.length === 0) {
    console.log('[Cron:UserDeletions] No pending user deletions to process')
    return { processed: 0, deleted: 0, errors: 0 }
  }

  console.log(`[Cron:UserDeletions] Found ${pendingDeletions.length} accounts to process`)

  for (const disagreement of pendingDeletions) {
    processed++

    try {
      // Update disagreement status to processing
      await adminClient
        .from('legal_disagreements')
        .update({ status: 'processing' })
        .eq('id', disagreement.id)

      // Anonymize the user's profile
      if (disagreement.profile_id) {
        const { error: profileError } = await adminClient
          .from('profiles')
          .update({
            first_name: 'Deleted',
            last_name: 'User',
            avatar_url: null,
            phone: null,
            address: null,
          })
          .eq('id', disagreement.profile_id)

        if (profileError) {
          console.error(`[Cron:UserDeletions] Error anonymizing profile ${disagreement.profile_id}:`, profileError)
          errors++
          continue
        }
      }

      // Delete the user from Supabase Auth
      // This will cascade to profiles via ON DELETE CASCADE or trigger
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(
        disagreement.user_id
      )

      if (deleteError) {
        console.error(`[Cron:UserDeletions] Error deleting user ${disagreement.user_id}:`, deleteError)
        // Even if auth deletion fails, mark as processed
        await adminClient
          .from('legal_disagreements')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', disagreement.id)
        errors++
        continue
      }

      // Update disagreement status to completed
      await adminClient
        .from('legal_disagreements')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', disagreement.id)

      deleted++
      console.log(`[Cron:UserDeletions] Successfully deleted user ${disagreement.user_id}`)
    } catch (error) {
      console.error(`[Cron:UserDeletions] Error processing disagreement ${disagreement.id}:`, error)
      errors++

      // Mark as error/completed to avoid reprocessing
      await adminClient
        .from('legal_disagreements')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', disagreement.id)
    }
  }

  console.log(`[Cron:UserDeletions] Completed: ${deleted} deleted, ${errors} errors`)
  return { processed, deleted, errors }
}
