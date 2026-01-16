'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
} from '@/lib/utils/server-auth'

// ==========================================
// GDPR-Compliant Data Export Functions
// ==========================================

interface DataExportStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  downloadUrl?: string
  expiresAt?: string
}

export async function getDataExportStatus(): Promise<{ status?: DataExportStatus; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, adminClient } = auth

  // Get most recent export request
  const { data: exportRequest } = await adminClient
    .from('data_export_requests')
    .select('id, status, download_url, download_expires_at')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })
    .limit(1)
    .single()

  if (!exportRequest) {
    return { status: { status: 'none' } }
  }

  // Check if expired
  if (
    exportRequest.status === 'completed' &&
    exportRequest.download_expires_at &&
    new Date(exportRequest.download_expires_at) < new Date()
  ) {
    return { status: { status: 'expired' } }
  }

  return {
    status: {
      status: exportRequest.status as DataExportStatus['status'],
      downloadUrl: exportRequest.download_url || undefined,
      expiresAt: exportRequest.download_expires_at || undefined,
    },
  }
}

export async function requestDataExport(): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Check rate limit: one export per 24 hours
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const { data: recentExport } = await adminClient
    .from('data_export_requests')
    .select('id')
    .eq('user_id', user.id)
    .gte('requested_at', twentyFourHoursAgo.toISOString())
    .limit(1)
    .single()

  if (recentExport) {
    return { error: 'You can only request one export per 24 hours' }
  }

  // Create export request
  const { error: insertError } = await adminClient
    .from('data_export_requests')
    .insert({
      user_id: user.id,
      profile_id: profile.id,
      status: 'pending',
    })

  if (insertError) {
    console.error('Error creating export request:', insertError)
    return { error: 'Failed to create export request' }
  }

  // TODO: Trigger background job to process the export
  // For now, we'll just mark it as pending
  // In production, this would trigger a Supabase Edge Function or similar

  return { success: true }
}

// ==========================================
// GDPR-Compliant Account Deletion Functions
// ==========================================

interface DeletionStatus {
  status: 'none' | 'pending' | 'processing' | 'completed' | 'cancelled'
  scheduledAt?: string
}

export async function getAccountDeletionStatus(): Promise<{ status?: DeletionStatus; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, adminClient } = auth

  // Get most recent deletion request that's not completed/cancelled
  const { data: deletionRequest } = await adminClient
    .from('account_deletion_requests')
    .select('id, status, requested_at')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .order('requested_at', { ascending: false })
    .limit(1)
    .single()

  if (!deletionRequest) {
    return { status: { status: 'none' } }
  }

  // Calculate scheduled deletion time (24 hours from request)
  const scheduledAt = new Date(deletionRequest.requested_at)
  scheduledAt.setHours(scheduledAt.getHours() + 24)

  return {
    status: {
      status: deletionRequest.status as DeletionStatus['status'],
      scheduledAt: scheduledAt.toISOString(),
    },
  }
}

export async function requestAccountDeletion(reason?: string): Promise<{
  success?: boolean
  scheduledAt?: string
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, profile, adminClient } = auth

  // Check if there's already a pending request
  const { data: existingRequest } = await adminClient
    .from('account_deletion_requests')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .limit(1)
    .single()

  if (existingRequest) {
    return { error: 'You already have a pending deletion request' }
  }

  const now = new Date()
  const scheduledAt = new Date(now)
  scheduledAt.setHours(scheduledAt.getHours() + 24)

  // Create deletion request
  const { error: insertError } = await adminClient
    .from('account_deletion_requests')
    .insert({
      user_id: user.id,
      profile_id: profile.id,
      status: 'pending',
      reason: reason || null,
    })

  if (insertError) {
    console.error('Error creating deletion request:', insertError)
    return { error: 'Failed to create deletion request' }
  }

  // TODO: Schedule actual deletion after 24 hours
  // This would be handled by a cron job or scheduled function

  return { success: true, scheduledAt: scheduledAt.toISOString() }
}

export async function cancelAccountDeletion(): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { user, adminClient } = auth

  // Find and cancel pending deletion request
  const { data: deletionRequest, error: fetchError } = await adminClient
    .from('account_deletion_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !deletionRequest) {
    return { error: 'No pending deletion request found' }
  }

  const { error: updateError } = await adminClient
    .from('account_deletion_requests')
    .update({ status: 'cancelled' })
    .eq('id', deletionRequest.id)

  if (updateError) {
    console.error('Error cancelling deletion request:', updateError)
    return { error: 'Failed to cancel deletion request' }
  }

  return { success: true }
}
