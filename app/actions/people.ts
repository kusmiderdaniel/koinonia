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

  // Fetch all members of the church
  const { data: members, error } = await supabase
    .from('church_members')
    .select(`
      id,
      user_id,
      church_id,
      role,
      email,
      phone,
      full_name,
      notes,
      joined_at
    `)
    .eq('church_id', churchId)
    .order('joined_at', { ascending: false })

  if (error) {
    console.error('Error fetching church members:', error)
    return { error: error.message, members: [] }
  }

  return { members: members || [] }
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

  const { data: values, error } = await supabase
    .from('custom_field_values')
    .select('*')
    .eq('church_id', churchId)

  if (error) {
    console.error('Error fetching custom field values:', error)
    return { error: error.message, values: [] }
  }

  return { values: values || [] }
}

export async function updateCustomFieldValue(
  memberId: string,
  fieldId: string,
  churchId: string,
  value: any
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Upsert the custom field value
  const { error } = await supabase
    .from('custom_field_values')
    .upsert(
      {
        member_id: memberId,
        field_id: fieldId,
        church_id: churchId,
        value,
      },
      {
        onConflict: 'member_id,field_id',
      }
    )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/people')
  return { success: true }
}
