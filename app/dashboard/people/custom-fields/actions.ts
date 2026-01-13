'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
  requireManagePermission,
} from '@/lib/utils/server-auth'
import type {
  CustomFieldDefinition,
  CreateCustomFieldInput,
  UpdateCustomFieldInput,
  CustomFieldActionResult,
  CustomFieldValueType,
} from '@/types/custom-fields'

// ============================================================================
// FIELD DEFINITIONS - CRUD
// ============================================================================

/**
 * Get all custom field definitions for the current church
 */
export async function getCustomFieldDefinitions(): Promise<{
  data?: CustomFieldDefinition[]
  error?: string
}> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data, error } = await adminClient
    .from('custom_field_definitions')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('display_order')

  if (error) {
    console.error('Error fetching custom field definitions:', error)
    return { error: 'Failed to fetch custom fields' }
  }

  // Parse JSONB fields
  const definitions = data.map((d) => ({
    ...d,
    options: d.options || [],
    settings: d.settings || {},
  })) as CustomFieldDefinition[]

  return { data: definitions }
}

/**
 * Create a new custom field definition
 */
export async function createCustomFieldDefinition(
  input: CreateCustomFieldInput
): Promise<CustomFieldActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins and owners can create field definitions
  const permError = requireAdminPermission(profile.role, 'create custom fields')
  if (permError) return { error: permError }

  // Validate input
  if (!input.name?.trim()) {
    return { error: 'Field name is required' }
  }

  // Get the next display order
  const { data: existingFields } = await adminClient
    .from('custom_field_definitions')
    .select('display_order')
    .eq('church_id', profile.church_id)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = existingFields && existingFields.length > 0
    ? existingFields[0].display_order + 1
    : 0

  const { data, error } = await adminClient
    .from('custom_field_definitions')
    .insert({
      church_id: profile.church_id,
      name: input.name.trim(),
      field_type: input.field_type,
      description: input.description || null,
      options: input.options || [],
      settings: input.settings || {},
      default_visible: input.default_visible ?? true,
      display_order: nextOrder,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating custom field definition:', error)
    return { error: 'Failed to create custom field' }
  }

  revalidatePath('/dashboard/people')

  return {
    success: true,
    data: {
      ...data,
      options: data.options || [],
      settings: data.settings || {},
    } as CustomFieldDefinition,
  }
}

/**
 * Update an existing custom field definition
 */
export async function updateCustomFieldDefinition(
  id: string,
  input: UpdateCustomFieldInput
): Promise<CustomFieldActionResult> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins and owners can update field definitions
  const permError = requireAdminPermission(profile.role, 'update custom fields')
  if (permError) return { error: permError }

  // Verify the field belongs to the user's church
  const { data: existingField } = await adminClient
    .from('custom_field_definitions')
    .select('church_id')
    .eq('id', id)
    .single()

  if (!existingField) {
    return { error: 'Field not found' }
  }

  if (existingField.church_id !== profile.church_id) {
    return { error: 'Cannot update fields from other churches' }
  }

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.name !== undefined) updateData.name = input.name.trim()
  if (input.description !== undefined) updateData.description = input.description
  if (input.options !== undefined) updateData.options = input.options
  if (input.settings !== undefined) updateData.settings = input.settings
  if (input.default_visible !== undefined) updateData.default_visible = input.default_visible

  const { data, error } = await adminClient
    .from('custom_field_definitions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating custom field definition:', error)
    return { error: 'Failed to update custom field' }
  }

  revalidatePath('/dashboard/people')

  return {
    success: true,
    data: {
      ...data,
      options: data.options || [],
      settings: data.settings || {},
    } as CustomFieldDefinition,
  }
}

/**
 * Delete a custom field definition (cascades to values)
 */
export async function deleteCustomFieldDefinition(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins and owners can delete field definitions
  const permError = requireAdminPermission(profile.role, 'delete custom fields')
  if (permError) return { error: permError }

  // Verify the field belongs to the user's church
  const { data: existingField } = await adminClient
    .from('custom_field_definitions')
    .select('church_id')
    .eq('id', id)
    .single()

  if (!existingField) {
    return { error: 'Field not found' }
  }

  if (existingField.church_id !== profile.church_id) {
    return { error: 'Cannot delete fields from other churches' }
  }

  const { error } = await adminClient
    .from('custom_field_definitions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting custom field definition:', error)
    return { error: 'Failed to delete custom field' }
  }

  revalidatePath('/dashboard/people')

  return { success: true }
}

/**
 * Reorder custom field definitions
 */
export async function reorderCustomFields(
  fieldIds: string[]
): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admins and owners can reorder field definitions
  const permError = requireAdminPermission(profile.role, 'reorder custom fields')
  if (permError) return { error: permError }

  // Update each field's display_order
  const updates = fieldIds.map((id, index) =>
    adminClient
      .from('custom_field_definitions')
      .update({ display_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('church_id', profile.church_id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  if (hasError) {
    console.error('Error reordering custom fields:', results.filter((r) => r.error))
    return { error: 'Failed to reorder custom fields' }
  }

  revalidatePath('/dashboard/people')

  return { success: true }
}

// ============================================================================
// FIELD VALUES - Update
// ============================================================================

/**
 * Update a custom field value for a member
 * Uses upsert to create or update the value
 */
export async function updateCustomFieldValue(
  memberId: string,
  fieldId: string,
  value: CustomFieldValueType
): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Leaders and above can update field values
  const permError = requireManagePermission(profile.role, 'update custom field values')
  if (permError) return { error: permError }

  // Verify the member belongs to the user's church
  const { data: targetMember } = await adminClient
    .from('profiles')
    .select('church_id')
    .eq('id', memberId)
    .single()

  if (!targetMember) {
    return { error: 'Member not found' }
  }

  if (targetMember.church_id !== profile.church_id) {
    return { error: 'Cannot update values for members from other churches' }
  }

  // Verify the field belongs to the user's church
  const { data: field } = await adminClient
    .from('custom_field_definitions')
    .select('church_id')
    .eq('id', fieldId)
    .single()

  if (!field) {
    return { error: 'Field not found' }
  }

  if (field.church_id !== profile.church_id) {
    return { error: 'Cannot update values for fields from other churches' }
  }

  // Upsert the value (insert if not exists, update if exists)
  const { error } = await adminClient
    .from('custom_field_values')
    .upsert(
      {
        church_id: profile.church_id,
        profile_id: memberId,
        field_id: fieldId,
        value: value,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'profile_id,field_id',
      }
    )

  if (error) {
    console.error('Error updating custom field value:', error)
    return { error: 'Failed to update field value' }
  }

  // Don't revalidatePath for inline updates - use optimistic updates
  // This prevents scroll position reset

  return { success: true }
}

/**
 * Delete a custom field value for a member
 */
export async function deleteCustomFieldValue(
  memberId: string,
  fieldId: string
): Promise<{ success?: boolean; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Leaders and above can delete field values
  const permError = requireManagePermission(profile.role, 'delete custom field values')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('custom_field_values')
    .delete()
    .eq('profile_id', memberId)
    .eq('field_id', fieldId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting custom field value:', error)
    return { error: 'Failed to delete field value' }
  }

  return { success: true }
}
