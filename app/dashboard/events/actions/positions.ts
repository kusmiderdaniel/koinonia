'use server'

import { revalidatePath } from 'next/cache'
import {
  positionSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import type { PositionInput } from './helpers'

export async function addEventPosition(eventId: string, data: PositionInput) {
  const validated = positionSchema.safeParse(data)
  if (!validated.success) return { error: 'Invalid data provided' }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add positions')
  if (permError) return { error: permError }

  const { data: position, error } = await adminClient
    .from('event_positions')
    .insert({
      event_id: eventId,
      ministry_id: validated.data.ministryId,
      role_id: validated.data.roleId || null,
      title: validated.data.title,
      quantity_needed: validated.data.quantityNeeded,
      notes: validated.data.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding position:', error)
    return { error: 'Failed to add position' }
  }

  revalidatePath('/dashboard/events')
  return { data: position }
}

export async function updateEventPosition(positionId: string, data: Partial<PositionInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'update positions')
  if (permError) return { error: permError }

  const updateData: Record<string, unknown> = {}
  if (data.ministryId !== undefined) updateData.ministry_id = data.ministryId
  if (data.roleId !== undefined) updateData.role_id = data.roleId || null
  if (data.title !== undefined) updateData.title = data.title
  if (data.quantityNeeded !== undefined) updateData.quantity_needed = data.quantityNeeded
  if (data.notes !== undefined) updateData.notes = data.notes || null

  const { error } = await adminClient
    .from('event_positions')
    .update(updateData)
    .eq('id', positionId)

  if (error) {
    console.error('Error updating position:', error)
    return { error: 'Failed to update position' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

export async function removeEventPosition(positionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'remove positions')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('event_positions')
    .delete()
    .eq('id', positionId)

  if (error) {
    console.error('Error removing position:', error)
    return { error: 'Failed to remove position' }
  }

  revalidatePath('/dashboard/events')
  return { success: true }
}

interface PositionToAdd {
  ministryId: string
  roleId: string
  roleName: string
}

export async function addMultiplePositions(eventId: string, positions: PositionToAdd[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add positions')
  if (permError) return { error: permError }

  const { data: maxOrderItem } = await adminClient
    .from('event_positions')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  let nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1

  const positionsToInsert = positions.map((p, idx) => ({
    event_id: eventId,
    ministry_id: p.ministryId,
    role_id: p.roleId,
    title: p.roleName,
    quantity_needed: 1,
    sort_order: nextSortOrder + idx,
  }))

  const { data: addedPositions, error } = await adminClient
    .from('event_positions')
    .insert(positionsToInsert)
    .select()

  if (error) {
    console.error('Error adding positions:', error)
    return { error: 'Failed to add positions' }
  }

  revalidatePath('/dashboard/events')
  return { data: addedPositions }
}
