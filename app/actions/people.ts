'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getChurchMembers(churchId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', members: [] }
  }

  // Fetch all members of the church with profile data
  const { data: members, error } = await supabase
    .from('church_members')
    .select(`
      id,
      user_id,
      church_id,
      role,
      notes,
      joined_at,
      profiles!church_members_user_id_fkey (
        email,
        phone,
        full_name
      )
    `)
    .eq('church_id', churchId)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching church members:', error)
    return { error: error.message, members: [] }
  }

  // Flatten the profile data into the member object
  const formattedMembers = members?.map((member: any) => ({
    id: member.id,
    user_id: member.user_id,
    church_id: member.church_id,
    role: member.role,
    email: member.profiles?.email || null,
    phone: member.profiles?.phone || null,
    full_name: member.profiles?.full_name || null,
    notes: member.notes,
    joined_at: member.joined_at,
  })) || []

  return { members: formattedMembers }
}

export async function updateMemberRole(memberId: string, role: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Validate role
  const validRoles = ['owner', 'admin', 'leader', 'member']
  if (!validRoles.includes(role)) {
    return { error: 'Invalid role' }
  }

  const { error } = await supabase
    .from('church_members')
    .update({ role })
    .eq('id', memberId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true }
}

export async function updateMemberInfo(
  memberId: string,
  data: {
    email?: string
    phone?: string
    full_name?: string
    notes?: string
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('church_members')
    .update(data)
    .eq('id', memberId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('church_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true }
}

export async function getCustomFields(churchId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', fields: [] }
  }

  const { data: fields, error } = await supabase
    .from('custom_fields')
    .select('*')
    .eq('church_id', churchId)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching custom fields:', error)
    return { error: error.message, fields: [] }
  }

  return { fields: fields || [] }
}

export async function createCustomField(
  churchId: string,
  field: {
    name: string
    field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
    options?: string[]
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get the highest position for ordering
  const { data: existingFields } = await supabase
    .from('custom_fields')
    .select('position')
    .eq('church_id', churchId)
    .order('position', { ascending: false })
    .limit(1)

  const position = existingFields && existingFields.length > 0
    ? existingFields[0].position + 1
    : 0

  const { data, error } = await supabase
    .from('custom_fields')
    .insert({
      church_id: churchId,
      name: field.name,
      field_type: field.field_type,
      options: field.options || [],
      position,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true, field: data }
}

export async function deleteCustomField(fieldId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('custom_fields')
    .delete()
    .eq('id', fieldId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true }
}

export async function getCustomFieldValues(churchId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', values: [] }
  }

  // First, get all member IDs for this church
  const { data: members, error: membersError } = await supabase
    .from('church_members')
    .select('id')
    .eq('church_id', churchId)

  if (membersError) {
    console.error('Error fetching church members:', membersError)
    return { error: membersError.message, values: [] }
  }

  if (!members || members.length === 0) {
    return { values: [] }
  }

  const memberIds = members.map(m => m.id)

  // Get all custom field values for these members
  const { data: values, error } = await supabase
    .from('custom_field_values')
    .select(`
      id,
      church_member_id,
      custom_field_id,
      value_text,
      value_number,
      value_date,
      value_select,
      value_multiselect
    `)
    .in('church_member_id', memberIds)

  if (error) {
    console.error('Error fetching custom field values:', error)
    return { error: error.message, values: [] }
  }

  return { values: values || [] }
}

export async function updateCustomFieldValue(
  memberId: string,
  fieldId: string,
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect',
  value: any
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Determine which column to update based on field type
  const updateData: any = {
    church_member_id: memberId,
    custom_field_id: fieldId,
  }

  // Clear all value columns first
  updateData.value_text = null
  updateData.value_number = null
  updateData.value_date = null
  updateData.value_select = null
  updateData.value_multiselect = null

  // Set the appropriate column based on field type
  switch (fieldType) {
    case 'text':
      updateData.value_text = value
      break
    case 'number':
      updateData.value_number = value ? parseFloat(value) : null
      break
    case 'date':
      updateData.value_date = value
      break
    case 'select':
      updateData.value_select = value
      break
    case 'multiselect':
      updateData.value_multiselect = Array.isArray(value) ? value : [value]
      break
  }

  // Upsert the custom field value
  const { error } = await supabase
    .from('custom_field_values')
    .upsert(updateData, {
      onConflict: 'church_member_id,custom_field_id',
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true }
}
