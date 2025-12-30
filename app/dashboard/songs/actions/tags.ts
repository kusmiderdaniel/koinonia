'use server'

import { revalidatePath } from 'next/cache'
import {
  tagSchema,
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from './helpers'
import type { TagInput } from './helpers'

export async function getTags() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: tags, error } = await adminClient
    .from('song_tags')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching tags:', error)
    return { error: 'Failed to load tags' }
  }

  return { data: tags }
}

export async function createTag(data: TagInput) {
  const validated = tagSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create tags')
  if (permError) return { error: permError }

  const { data: tag, error } = await adminClient
    .from('song_tags')
    .insert({
      church_id: profile.church_id,
      name: validated.data.name,
      color: validated.data.color,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A tag with this name already exists' }
    }
    console.error('Error creating tag:', error)
    return { error: 'Failed to create tag' }
  }

  return { data: tag }
}

export async function deleteTag(tagId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'delete tags')
  if (permError) return { error: permError }

  const { error } = await adminClient
    .from('song_tags')
    .delete()
    .eq('id', tagId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting tag:', error)
    return { error: 'Failed to delete tag' }
  }

  revalidatePath('/dashboard/songs')
  return { success: true }
}
