import { createServiceRoleClient } from '@/lib/supabase/server'

interface ProcessUserDeletionsResult {
  processed: number
  deleted: number
  errors: number
}

/**
 * Process pending user deletions for ToS/Privacy Policy disagreements.
 * Runs daily to find disagreements past their deadline and delete/anonymize accounts.
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
