'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

export async function addTemplatePositions(
  templateId: string,
  positions: { ministryId: string; roleId: string; roleName: string }[]
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Verify template belongs to user's church
  const { data: template } = await adminClient
    .from('event_templates')
    .select('id')
    .eq('id', templateId)
    .eq('church_id', profile.church_id)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  // Get current max sort_order
  const { data: maxOrderPosition } = await adminClient
    .from('event_template_positions')
    .select('sort_order')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  let nextSortOrder = (maxOrderPosition?.sort_order ?? -1) + 1

  // Create positions
  const positionsToInsert = positions.map((p) => ({
    template_id: templateId,
    ministry_id: p.ministryId,
    role_id: p.roleId || null,
    title: p.roleName,
    quantity_needed: 1,
    sort_order: nextSortOrder++,
  }))

  const { data: insertedPositions, error } = await adminClient
    .from('event_template_positions')
    .insert(positionsToInsert)
    .select(`
      *,
      ministry:ministries (
        id,
        name
      ),
      role:ministry_roles (
        id,
        name
      )
    `)

  if (error) {
    console.error('Error creating template positions:', error)
    return { error: 'Failed to add positions' }
  }

  revalidatePath('/dashboard/events')

  return { data: insertedPositions }
}

export async function updateTemplatePosition(
  positionId: string,
  data: { title?: string; quantityNeeded?: number; notes?: string }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.quantityNeeded !== undefined) updateData.quantity_needed = data.quantityNeeded
  if (data.notes !== undefined) updateData.notes = data.notes || null

  const { error } = await adminClient
    .from('event_template_positions')
    .update(updateData)
    .eq('id', positionId)

  if (error) {
    console.error('Error updating template position:', error)
    return { error: 'Failed to update position' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}

export async function removeTemplatePosition(positionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireAdminPermission(profile.role, 'modify templates')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_template_positions')
    .delete()
    .eq('id', positionId)

  if (error) {
    console.error('Error removing template position:', error)
    return { error: 'Failed to remove position' }
  }

  revalidatePath('/dashboard/events')

  return { success: true }
}
