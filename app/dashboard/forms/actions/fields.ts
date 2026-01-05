'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '@/lib/utils/server-auth'
import { formFieldSchema, type FormFieldInput } from '@/lib/validations/forms'

export async function getFormFields(formId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', formId)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  const { data: fields, error } = await adminClient
    .from('form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('sort_order')

  if (error) {
    console.error('Error fetching form fields:', error)
    return { error: 'Failed to load form fields' }
  }

  return { data: fields }
}

export async function createFormField(formId: string, data: Omit<FormFieldInput, 'id'>) {
  const validated = formFieldSchema.omit({ id: true }).safeParse(data)
  if (!validated.success) {
    console.error('Validation error:', validated.error)
    return { error: 'Invalid field data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Verify form belongs to church and is not published
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id, status')
    .eq('id', formId)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  const { data: field, error } = await adminClient
    .from('form_fields')
    .insert({
      form_id: formId,
      type: validated.data.type,
      label: validated.data.label,
      description: validated.data.description || null,
      placeholder: validated.data.placeholder || null,
      required: validated.data.required,
      options: validated.data.options || null,
      sort_order: validated.data.sortOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating form field:', error)
    return { error: 'Failed to create form field' }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { data: field }
}

export async function updateFormField(fieldId: string, data: Partial<FormFieldInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Get field
  const { data: field } = await adminClient
    .from('form_fields')
    .select('form_id')
    .eq('id', fieldId)
    .single()

  if (!field) {
    return { error: 'Field not found' }
  }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', field.form_id)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Field not found' }
  }

  const updateData: Record<string, unknown> = {}
  if (data.type !== undefined) updateData.type = data.type
  if (data.label !== undefined) updateData.label = data.label
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.placeholder !== undefined) updateData.placeholder = data.placeholder || null
  if (data.required !== undefined) updateData.required = data.required
  if (data.options !== undefined) updateData.options = data.options || null
  if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder

  const { error } = await adminClient
    .from('form_fields')
    .update(updateData)
    .eq('id', fieldId)

  if (error) {
    console.error('Error updating form field:', error)
    return { error: 'Failed to update form field' }
  }

  revalidatePath(`/dashboard/forms/${field.form_id}`)
  return { success: true }
}

export async function deleteFormField(fieldId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Get field
  const { data: field } = await adminClient
    .from('form_fields')
    .select('form_id')
    .eq('id', fieldId)
    .single()

  if (!field) {
    return { error: 'Field not found' }
  }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', field.form_id)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Field not found' }
  }

  const formId = field.form_id

  const { error } = await adminClient
    .from('form_fields')
    .delete()
    .eq('id', fieldId)

  if (error) {
    console.error('Error deleting form field:', error)
    return { error: 'Failed to delete form field' }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true }
}

export async function reorderFormFields(formId: string, fieldIds: string[]) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', formId)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  // Update sort_order for each field
  const updates = fieldIds.map((id, index) =>
    adminClient
      .from('form_fields')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('form_id', formId)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    console.error('Error reordering fields')
    return { error: 'Failed to reorder fields' }
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true }
}

export async function bulkSaveFormFields(
  formId: string,
  fields: Array<FormFieldInput & { id?: string; isNew?: boolean; isDeleted?: boolean }>
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { data: form } = await adminClient
    .from('forms')
    .select('church_id')
    .eq('id', formId)
    .single()

  if (!form || form.church_id !== profile.church_id) {
    return { error: 'Form not found' }
  }

  // Process fields
  const toCreate: typeof fields = []
  const toUpdate: typeof fields = []
  const toDelete: string[] = []

  for (const field of fields) {
    if (field.isDeleted && field.id && !field.isNew) {
      toDelete.push(field.id)
    } else if (field.isNew) {
      toCreate.push(field)
    } else if (field.id) {
      toUpdate.push(field)
    }
  }

  // Delete fields
  if (toDelete.length > 0) {
    await adminClient.from('form_fields').delete().in('id', toDelete)
  }

  // Create new fields
  if (toCreate.length > 0) {
    const inserts = toCreate.map(field => ({
      form_id: formId,
      type: field.type,
      label: field.label,
      description: field.description || null,
      placeholder: field.placeholder || null,
      required: field.required,
      options: field.options || null,
      settings: field.settings || null,
      sort_order: field.sortOrder,
    }))
    await adminClient.from('form_fields').insert(inserts)
  }

  // Update existing fields
  for (const field of toUpdate) {
    await adminClient
      .from('form_fields')
      .update({
        type: field.type,
        label: field.label,
        description: field.description || null,
        placeholder: field.placeholder || null,
        required: field.required,
        options: field.options || null,
        settings: field.settings || null,
        sort_order: field.sortOrder,
      })
      .eq('id', field.id!)
  }

  revalidatePath(`/dashboard/forms/${formId}`)
  return { success: true }
}
