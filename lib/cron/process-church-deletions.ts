/**
 * @module lib/cron/process-church-deletions
 * @description Handles automated church deletion processing for GDPR/DPA compliance.
 *
 * This cron job processes churches that have been scheduled for deletion due to
 * legal disagreements (e.g., DPA rejection, Admin Terms disagreement). It runs
 * daily to find and process deletions past their deadline.
 *
 * @workflow
 * 1. Find all church_deletion_schedules with status 'pending' and past deadline
 * 2. For each scheduled deletion:
 *    - Disconnect all church members (set church_id to null)
 *    - Delete the church (cascades to related data)
 *    - Update the related legal_disagreement status to 'completed'
 *
 * @database-tables
 * - church_deletion_schedules: Tracks scheduled church deletions
 * - legal_disagreements: Original disagreement records
 * - profiles: Member profiles to disconnect
 * - churches: Church records to delete
 *
 * @schedule Runs daily via Vercel Cron
 * @see /app/api/cron/process-church-deletions/route.ts
 */

import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Result of processing church deletions
 */
interface ProcessChurchDeletionsResult {
  /** Number of scheduled deletions found and processed */
  processed: number
  /** Number of churches successfully deleted */
  deleted: number
  /** Number of members disconnected from deleted churches */
  membersDisconnected: number
  /** Number of errors encountered during processing */
  errors: number
}

/**
 * Process pending church deletions for DPA/Admin Terms disagreements.
 *
 * This function finds all church deletion schedules that are past their deadline
 * and processes them by disconnecting members and deleting the church.
 *
 * @returns {Promise<ProcessChurchDeletionsResult>} Results of the deletion processing
 *
 * @example
 * // Called from the cron API route
 * const result = await processChurchDeletions()
 * // { processed: 2, deleted: 2, membersDisconnected: 15, errors: 0 }
 *
 * @throws Never throws - errors are caught and logged, returned in result.errors
 */
export async function processChurchDeletions(): Promise<ProcessChurchDeletionsResult> {
  const adminClient = createServiceRoleClient()
  const now = new Date().toISOString()

  let processed = 0
  let deleted = 0
  let membersDisconnected = 0
  let errors = 0

  // Find pending church deletions past their deadline
  const { data: pendingDeletions, error: fetchError } = await adminClient
    .from('church_deletion_schedules')
    .select(`
      id,
      church_id,
      disagreement_id,
      church:churches(id, name)
    `)
    .eq('status', 'pending')
    .lt('scheduled_deletion_at', now)

  if (fetchError) {
    console.error('[Cron:ChurchDeletions] Error fetching pending deletions:', fetchError)
    return { processed: 0, deleted: 0, membersDisconnected: 0, errors: 1 }
  }

  if (!pendingDeletions || pendingDeletions.length === 0) {
    console.log('[Cron:ChurchDeletions] No pending church deletions to process')
    return { processed: 0, deleted: 0, membersDisconnected: 0, errors: 0 }
  }

  console.log(`[Cron:ChurchDeletions] Found ${pendingDeletions.length} churches to process`)

  for (const schedule of pendingDeletions) {
    processed++

    try {
      const churchData = schedule.church as Array<{ id: string; name: string }> | null
      const church = churchData?.[0]
      const churchName = church?.name || 'Unknown Church'

      console.log(`[Cron:ChurchDeletions] Processing deletion for church: ${churchName}`)

      // Update schedule status to processing
      await adminClient
        .from('church_deletion_schedules')
        .update({ status: 'completed' })
        .eq('id', schedule.id)

      // Count and disconnect all members
      const { data: members, error: membersError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('church_id', schedule.church_id)

      if (membersError) {
        console.error(`[Cron:ChurchDeletions] Error fetching members for church ${schedule.church_id}:`, membersError)
      }

      const memberCount = members?.length || 0

      // Disconnect all members from the church (set church_id to null)
      // This preserves their accounts but removes church association
      const { error: disconnectError } = await adminClient
        .from('profiles')
        .update({ church_id: null, role: 'member' })
        .eq('church_id', schedule.church_id)

      if (disconnectError) {
        console.error(`[Cron:ChurchDeletions] Error disconnecting members from church ${schedule.church_id}:`, disconnectError)
        errors++
        continue
      }

      membersDisconnected += memberCount

      // Delete the church
      // This should cascade to related tables (ministries, events, etc.)
      const { error: deleteError } = await adminClient
        .from('churches')
        .delete()
        .eq('id', schedule.church_id)

      if (deleteError) {
        console.error(`[Cron:ChurchDeletions] Error deleting church ${schedule.church_id}:`, deleteError)
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
        .eq('id', schedule.disagreement_id)

      deleted++
      console.log(`[Cron:ChurchDeletions] Successfully deleted church ${churchName}, disconnected ${memberCount} members`)
    } catch (error) {
      console.error(`[Cron:ChurchDeletions] Error processing schedule ${schedule.id}:`, error)
      errors++

      // Mark as completed to avoid reprocessing
      await adminClient
        .from('church_deletion_schedules')
        .update({ status: 'completed' })
        .eq('id', schedule.id)
    }
  }

  console.log(`[Cron:ChurchDeletions] Completed: ${deleted} deleted, ${membersDisconnected} members disconnected, ${errors} errors`)
  return { processed, deleted, membersDisconnected, errors }
}
