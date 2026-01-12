'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'
import { formConditionSchema, type FormConditionInput } from '@/lib/validations/forms'

export async function getFormConditions(formId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', formId, profile.church_id, 'church_id', 'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  const { data: conditions, error } = await adminClient
    .from('form_conditions')
    .select('id, form_id, target_field_id, source_field_id, operator, value, action, created_at')
    .eq('form_id', formId)

  if (error) {
    console.error('Error fetching form conditions:', error)
    return { error: 'Failed to load form conditions' }
  }

  return { data: conditions }
}

export async function createFormCondition(formId: string, data: Omit<FormConditionInput, 'id'>) {
  const validated = formConditionSchema.omit({ id: true }).safeParse(data)
  if (!validated.success) {
    console.error('Validation error:', validated.error)
    return { error: 'Invalid condition data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', formId, profile.church_id, 'church_id', 'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  // Verify both fields belong to this form
  const { data: fields } = await adminClient
    .from('form_fields')
    .select('id')
    .eq('form_id', formId)
    .in('id', [validated.data.targetFieldId, validated.data.sourceFieldId])

  if (!fields || fields.length !== 2) {
    return { error: 'Invalid field references' }
  }

  const { data: condition, error } = await adminClient
    .from('form_conditions')
    .insert({
      form_id: formId,
      target_field_id: validated.data.targetFieldId,
      source_field_id: validated.data.sourceFieldId,
      operator: validated.data.operator,
      value: validated.data.value || null,
      action: validated.data.action,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating form condition:', error)
    return { error: 'Failed to create form condition' }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { data: condition }
}

export async function updateFormCondition(conditionId: string, data: Partial<FormConditionInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Get condition
  const { data: condition } = await adminClient
    .from('form_conditions')
    .select('form_id')
    .eq('id', conditionId)
    .single()

  if (!condition) {
    return { error: 'Condition not found' }
  }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', condition.form_id, profile.church_id, 'church_id', 'Condition not found'
  )
  if (ownershipError) return { error: ownershipError }

  const updateData: Record<string, unknown> = {}
  if (data.targetFieldId !== undefined) updateData.target_field_id = data.targetFieldId
  if (data.sourceFieldId !== undefined) updateData.source_field_id = data.sourceFieldId
  if (data.operator !== undefined) updateData.operator = data.operator
  if (data.value !== undefined) updateData.value = data.value || null
  if (data.action !== undefined) updateData.action = data.action

  const { error } = await adminClient
    .from('form_conditions')
    .update(updateData)
    .eq('id', conditionId)

  if (error) {
    console.error('Error updating form condition:', error)
    return { error: 'Failed to update form condition' }
  }

  revalidatePath(`/dashboard/forms/${condition.form_id}`)
  return { success: true }
}

export async function deleteFormCondition(conditionId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Get condition
  const { data: condition } = await adminClient
    .from('form_conditions')
    .select('form_id')
    .eq('id', conditionId)
    .single()

  if (!condition) {
    return { error: 'Condition not found' }
  }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', condition.form_id, profile.church_id, 'church_id', 'Condition not found'
  )
  if (ownershipError) return { error: ownershipError }

  const formId = condition.form_id

  const { error } = await adminClient
    .from('form_conditions')
    .delete()
    .eq('id', conditionId)

  if (error) {
    console.error('Error deleting form condition:', error)
    return { error: 'Failed to delete form condition' }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true }
}

export async function bulkSaveFormConditions(
  formId: string,
  conditions: Array<FormConditionInput & { id?: string; isNew?: boolean; isDeleted?: boolean }>
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', formId, profile.church_id, 'church_id', 'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  // Process conditions
  const toCreate: typeof conditions = []
  const toUpdate: typeof conditions = []
  const toDelete: string[] = []

  for (const condition of conditions) {
    if (condition.isDeleted && condition.id && !condition.isNew) {
      toDelete.push(condition.id)
    } else if (condition.isNew) {
      toCreate.push(condition)
    } else if (condition.id) {
      toUpdate.push(condition)
    }
  }

  // Delete conditions
  if (toDelete.length > 0) {
    await adminClient.from('form_conditions').delete().in('id', toDelete)
  }

  // Create new conditions
  if (toCreate.length > 0) {
    const inserts = toCreate.map(condition => ({
      form_id: formId,
      target_field_id: condition.targetFieldId,
      source_field_id: condition.sourceFieldId,
      operator: condition.operator,
      value: condition.value || null,
      action: condition.action,
    }))
    await adminClient.from('form_conditions').insert(inserts)
  }

  // Update existing conditions
  for (const condition of toUpdate) {
    await adminClient
      .from('form_conditions')
      .update({
        target_field_id: condition.targetFieldId,
        source_field_id: condition.sourceFieldId,
        operator: condition.operator,
        value: condition.value || null,
        action: condition.action,
      })
      .eq('id', condition.id!)
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true }
}
