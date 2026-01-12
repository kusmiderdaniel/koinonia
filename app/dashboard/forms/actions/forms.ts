'use server'

import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'
import { formSchema, type FormInput } from '@/lib/validations/forms'
import type { FormStatus, FormAccessType } from '@/lib/validations/forms'

export async function getForms() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission - only leaders+ can view forms list
  const permError = requireManagePermission(profile.role, 'view forms')
  if (permError) return { error: permError }

  const { data: forms, error } = await adminClient
    .from('forms')
    .select(`
      *,
      creator:profiles!created_by (
        id,
        first_name,
        last_name
      )
    `)
    .eq('church_id', profile.church_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching forms:', error)
    return { error: 'Failed to load forms' }
  }

  // Get submission counts for each form
  const formIds = forms?.map(f => f.id) || []
  const { data: counts } = await adminClient
    .from('form_submissions')
    .select('form_id')
    .in('form_id', formIds)

  const countMap = (counts || []).reduce((acc, s) => {
    acc[s.form_id] = (acc[s.form_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const formsWithCounts = forms?.map(form => ({
    ...form,
    submissions_count: countMap[form.id] || 0,
  }))

  return { data: formsWithCounts, role: profile.role }
}

export async function getForm(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'view forms')
  if (permError) return { error: permError }

  const { data: form, error } = await adminClient
    .from('forms')
    .select(`
      *,
      creator:profiles!created_by (
        id,
        first_name,
        last_name
      )
    `)
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (error || !form) {
    console.error('Error fetching form:', error)
    return { error: 'Form not found' }
  }

  // Get fields
  const { data: fields } = await adminClient
    .from('form_fields')
    .select('*')
    .eq('form_id', id)
    .order('sort_order')

  // Get conditions
  const { data: conditions } = await adminClient
    .from('form_conditions')
    .select('*')
    .eq('form_id', id)

  // Get submission count
  const { count } = await adminClient
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id)

  return {
    data: {
      ...form,
      fields: fields || [],
      conditions: conditions || [],
      submissions_count: count || 0,
    },
    role: profile.role,
  }
}

export async function createForm(data: FormInput) {
  const validated = formSchema.safeParse(data)
  if (!validated.success) {
    return { error: 'Invalid data provided' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'create forms')
  if (permError) return { error: permError }

  const { data: form, error } = await adminClient
    .from('forms')
    .insert({
      church_id: profile.church_id,
      title: validated.data.title,
      description: validated.data.description || null,
      access_type: validated.data.accessType,
      allow_multiple_submissions: validated.data.allowMultipleSubmissions ?? false,
      is_multilingual: validated.data.isMultilingual ?? false,
      created_by: profile.id,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating form:', error)
    return { error: 'Failed to create form' }
  }

  revalidatePath('/dashboard/forms')
  return { data: form }
}

export async function updateForm(id: string, data: Partial<FormInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'edit forms')
  if (permError) return { error: permError }

  // Get current form data to check if we need to generate a public token
  const { data: currentForm, error: ownershipError } = await verifyChurchOwnership<{
    church_id: string; access_type: string; public_token: string | null
  }>(adminClient, 'forms', id, profile.church_id, 'church_id, access_type, public_token', 'Form not found')
  if (ownershipError || !currentForm) return { error: ownershipError || 'Form not found' }

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.titleI18n !== undefined) updateData.title_i18n = data.titleI18n
  if (data.descriptionI18n !== undefined) updateData.description_i18n = data.descriptionI18n
  if (data.accessType !== undefined) updateData.access_type = data.accessType
  if (data.allowMultipleSubmissions !== undefined) updateData.allow_multiple_submissions = data.allowMultipleSubmissions
  if (data.isMultilingual !== undefined) updateData.is_multilingual = data.isMultilingual

  // Generate public_token if changing to public and doesn't have one
  if (data.accessType === 'public' && !currentForm.public_token) {
    updateData.public_token = crypto.randomBytes(32).toString('base64url')
  }

  const { error } = await adminClient
    .from('forms')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating form:', error)
    return { error: 'Failed to update form' }
  }

  revalidatePath('/dashboard/forms')
  revalidatePath(`/dashboard/forms/${id}`)
  return { success: true }
}

export async function deleteForm(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'delete forms')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', id, profile.church_id, 'church_id', 'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  const { error } = await adminClient.from('forms').delete().eq('id', id)

  if (error) {
    console.error('Error deleting form:', error)
    return { error: 'Failed to delete form' }
  }

  revalidatePath('/dashboard/forms')
  return { success: true }
}

export async function publishForm(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'publish forms')
  if (permError) return { error: permError }

  // Get form with fields
  const { data: form, error: ownershipError } = await verifyChurchOwnership<{
    church_id: string; status: string; access_type: string; public_token: string | null
  }>(adminClient, 'forms', id, profile.church_id, 'church_id, status, access_type, public_token', 'Form not found')
  if (ownershipError || !form) return { error: ownershipError || 'Form not found' }

  // Check if form has at least one field
  const { count } = await adminClient
    .from('form_fields')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id)

  if (!count || count === 0) {
    return { error: 'Cannot publish a form without fields. Add at least one field first.' }
  }

  // Generate public token for public forms if not already set
  let publicToken = form.public_token
  if (form.access_type === 'public' && !publicToken) {
    publicToken = crypto.randomBytes(32).toString('base64url')
  }

  const { error } = await adminClient
    .from('forms')
    .update({
      status: 'published' as FormStatus,
      published_at: new Date().toISOString(),
      public_token: publicToken,
    })
    .eq('id', id)

  if (error) {
    console.error('Error publishing form:', error)
    return { error: 'Failed to publish form' }
  }

  revalidatePath('/dashboard/forms')
  revalidatePath(`/dashboard/forms/${id}`)
  return { success: true, publicToken }
}

export async function unpublishForm(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'unpublish forms')
  if (permError) return { error: permError }

  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', id, profile.church_id, 'church_id', 'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  const { error } = await adminClient
    .from('forms')
    .update({
      status: 'draft' as FormStatus,
    })
    .eq('id', id)

  if (error) {
    console.error('Error unpublishing form:', error)
    return { error: 'Failed to unpublish form' }
  }

  revalidatePath('/dashboard/forms')
  revalidatePath(`/dashboard/forms/${id}`)
  return { success: true }
}

export async function closeForm(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'close forms')
  if (permError) return { error: permError }

  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient, 'forms', id, profile.church_id, 'church_id', 'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  const { error } = await adminClient
    .from('forms')
    .update({
      status: 'closed' as FormStatus,
      closed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error closing form:', error)
    return { error: 'Failed to close form' }
  }

  revalidatePath('/dashboard/forms')
  revalidatePath(`/dashboard/forms/${id}`)
  return { success: true }
}

export async function duplicateForm(id: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission
  const permError = requireManagePermission(profile.role, 'create forms')
  if (permError) return { error: permError }

  // Get original form with fields and conditions
  const { data: originalForm } = await adminClient
    .from('forms')
    .select('*')
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (!originalForm) {
    return { error: 'Form not found' }
  }

  // Create new form
  const { data: newForm, error: formError } = await adminClient
    .from('forms')
    .insert({
      church_id: profile.church_id,
      title: `${originalForm.title} (Copy)`,
      title_i18n: originalForm.title_i18n,
      description: originalForm.description,
      description_i18n: originalForm.description_i18n,
      access_type: originalForm.access_type,
      allow_multiple_submissions: originalForm.allow_multiple_submissions,
      is_multilingual: originalForm.is_multilingual,
      settings: originalForm.settings,
      created_by: profile.id,
      status: 'draft',
    })
    .select()
    .single()

  if (formError || !newForm) {
    console.error('Error duplicating form:', formError)
    return { error: 'Failed to duplicate form' }
  }

  // Get original fields
  const { data: originalFields } = await adminClient
    .from('form_fields')
    .select('*')
    .eq('form_id', id)
    .order('sort_order')

  if (originalFields && originalFields.length > 0) {
    // Map old field IDs to new field IDs
    const fieldIdMap: Record<string, string> = {}

    // Create new fields
    for (const field of originalFields) {
      const { data: newField } = await adminClient
        .from('form_fields')
        .insert({
          form_id: newForm.id,
          type: field.type,
          label: field.label,
          label_i18n: field.label_i18n,
          description: field.description,
          description_i18n: field.description_i18n,
          placeholder: field.placeholder,
          placeholder_i18n: field.placeholder_i18n,
          required: field.required,
          options: field.options,
          options_i18n: field.options_i18n,
          settings: field.settings,
          sort_order: field.sort_order,
        })
        .select()
        .single()

      if (newField) {
        fieldIdMap[field.id] = newField.id
      }
    }

    // Get and duplicate conditions
    const { data: originalConditions } = await adminClient
      .from('form_conditions')
      .select('*')
      .eq('form_id', id)

    if (originalConditions && originalConditions.length > 0) {
      const newConditions = originalConditions
        .filter(c => fieldIdMap[c.target_field_id] && fieldIdMap[c.source_field_id])
        .map(condition => ({
          form_id: newForm.id,
          target_field_id: fieldIdMap[condition.target_field_id],
          source_field_id: fieldIdMap[condition.source_field_id],
          operator: condition.operator,
          value: condition.value,
          action: condition.action,
        }))

      if (newConditions.length > 0) {
        await adminClient.from('form_conditions').insert(newConditions)
      }
    }
  }

  revalidatePath('/dashboard/forms')
  return { data: newForm }
}
