'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  requireAdminPermission,
} from '@/lib/utils/server-auth'
import type {
  SavedView,
  CreateSavedViewInput,
  UpdateSavedViewInput,
  SavedViewActionResult,
  ViewType,
} from '@/types/saved-views'

// ============================================================================
// GET SAVED VIEWS
// ============================================================================

export async function getSavedViews(viewType: ViewType): Promise<{
  data?: SavedView[]
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('saved_views')
    .select('*')
    .eq('church_id', profile.church_id)
    .eq('view_type', viewType)
    .order('is_default', { ascending: false })
    .order('name')

  if (error) {
    console.error('Error fetching saved views:', error)
    return { error: 'Failed to fetch saved views' }
  }

  return { data: data as SavedView[] }
}

// ============================================================================
// CREATE SAVED VIEW
// ============================================================================

export async function createSavedView(
  input: CreateSavedViewInput
): Promise<SavedViewActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission: leaders or admins only
  const permError = requireManagePermission(profile.role, 'create saved views')
  if (permError) return { error: permError }

  // If setting as default, first unset any existing default
  if (input.is_default) {
    await adminClient
      .from('saved_views')
      .update({ is_default: false })
      .eq('church_id', profile.church_id)
      .eq('view_type', input.view_type)
      .eq('is_default', true)
  }

  const { data, error } = await adminClient
    .from('saved_views')
    .insert({
      church_id: profile.church_id,
      view_type: input.view_type,
      name: input.name,
      description: input.description || null,
      filter_state: input.filter_state,
      sort_state: input.sort_state,
      group_by: input.group_by || null,
      is_default: input.is_default || false,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating saved view:', error)
    return { error: 'Failed to create view' }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/people')

  return { success: true, data: data as SavedView }
}

// ============================================================================
// UPDATE SAVED VIEW
// ============================================================================

export async function updateSavedView(
  viewId: string,
  input: UpdateSavedViewInput
): Promise<SavedViewActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'update saved views')
  if (permError) return { error: permError }

  // Get existing view to verify ownership/church
  const { data: existingView } = await adminClient
    .from('saved_views')
    .select('church_id, view_type')
    .eq('id', viewId)
    .single()

  if (!existingView) {
    return { error: 'View not found' }
  }

  if (existingView.church_id !== profile.church_id) {
    return { error: 'Cannot update views from other churches' }
  }

  // If setting as default, unset others first
  if (input.is_default) {
    await adminClient
      .from('saved_views')
      .update({ is_default: false })
      .eq('church_id', profile.church_id)
      .eq('view_type', existingView.view_type)
      .neq('id', viewId)
  }

  const { data, error } = await adminClient
    .from('saved_views')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', viewId)
    .select()
    .single()

  if (error) {
    console.error('Error updating saved view:', error)
    return { error: 'Failed to update view' }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/people')

  return { success: true, data: data as SavedView }
}

// ============================================================================
// DELETE SAVED VIEW
// ============================================================================

export async function deleteSavedView(viewId: string): Promise<SavedViewActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Get existing view
  const { data: existingView } = await adminClient
    .from('saved_views')
    .select('church_id, created_by')
    .eq('id', viewId)
    .single()

  if (!existingView) {
    return { error: 'View not found' }
  }

  if (existingView.church_id !== profile.church_id) {
    return { error: 'Cannot delete views from other churches' }
  }

  // Check permission: creator can delete, or admins
  const isCreator = existingView.created_by === profile.id
  const isAdmin = ['owner', 'admin'].includes(profile.role)

  if (!isCreator && !isAdmin) {
    return { error: 'You can only delete views you created' }
  }

  const { error } = await adminClient.from('saved_views').delete().eq('id', viewId)

  if (error) {
    console.error('Error deleting saved view:', error)
    return { error: 'Failed to delete view' }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/people')

  return { success: true }
}

// ============================================================================
// SET DEFAULT VIEW
// ============================================================================

export async function setDefaultView(viewId: string): Promise<SavedViewActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can set default views
  const permError = requireAdminPermission(profile.role, 'set default views')
  if (permError) return { error: permError }

  // Get view to verify church and get view_type
  const { data: view } = await adminClient
    .from('saved_views')
    .select('church_id, view_type')
    .eq('id', viewId)
    .single()

  if (!view) {
    return { error: 'View not found' }
  }

  if (view.church_id !== profile.church_id) {
    return { error: 'Cannot modify views from other churches' }
  }

  // First unset any existing default for this view_type
  await adminClient
    .from('saved_views')
    .update({ is_default: false })
    .eq('church_id', profile.church_id)
    .eq('view_type', view.view_type)
    .eq('is_default', true)

  // Then set the new default
  const { error } = await adminClient
    .from('saved_views')
    .update({ is_default: true })
    .eq('id', viewId)

  if (error) {
    console.error('Error setting default view:', error)
    return { error: 'Failed to set default view' }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/people')

  return { success: true }
}

// ============================================================================
// CLEAR DEFAULT VIEW
// ============================================================================

export async function clearDefaultView(viewType: ViewType): Promise<SavedViewActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins can clear default views
  const permError = requireAdminPermission(profile.role, 'clear default views')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('saved_views')
    .update({ is_default: false })
    .eq('church_id', profile.church_id)
    .eq('view_type', viewType)
    .eq('is_default', true)

  if (error) {
    console.error('Error clearing default view:', error)
    return { error: 'Failed to clear default view' }
  }

  revalidatePath('/dashboard/tasks')
  revalidatePath('/dashboard/people')

  return { success: true }
}
