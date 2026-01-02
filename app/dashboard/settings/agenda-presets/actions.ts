'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireAdminPermission,
} from '@/lib/utils/server-auth'

// ============================================================================
// SCHEMAS
// ============================================================================

const presetSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  durationSeconds: z.number().int().positive().default(300),
  ministryId: z.string().uuid().nullable().optional(),
})

type PresetInput = z.infer<typeof presetSchema>

// ============================================================================
// GET PRESETS
// ============================================================================

export async function getAgendaPresets() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: presets, error } = await adminClient
    .from('agenda_item_presets')
    .select(`
      *,
      ministry:ministries (id, name, color)
    `)
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('title')

  if (error) {
    console.error('Error fetching presets:', error)
    return { error: 'Failed to load presets' }
  }

  return { data: presets }
}

// ============================================================================
// CREATE PRESET
// ============================================================================

export async function createAgendaPreset(data: PresetInput) {
  const validated = presetSchema.safeParse(data)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Invalid data' }
  }

  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admin/owner can manage presets
  const permError = requireAdminPermission(profile.role, 'manage agenda presets')
  if (permError) return { error: permError }

  const { data: preset, error } = await adminClient
    .from('agenda_item_presets')
    .insert({
      church_id: profile.church_id,
      title: validated.data.title,
      description: validated.data.description || null,
      duration_seconds: validated.data.durationSeconds,
      ministry_id: validated.data.ministryId || null,
    })
    .select(`
      *,
      ministry:ministries (id, name, color)
    `)
    .single()

  if (error) {
    console.error('Error creating preset:', error)
    return { error: 'Failed to create preset' }
  }

  revalidatePath('/dashboard/settings/agenda-presets')

  return { data: preset }
}

// ============================================================================
// UPDATE PRESET
// ============================================================================

export async function updateAgendaPreset(presetId: string, data: Partial<PresetInput>) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admin/owner can manage presets
  const permError = requireAdminPermission(profile.role, 'manage agenda presets')
  if (permError) return { error: permError }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description || null
  if (data.durationSeconds !== undefined) updateData.duration_seconds = data.durationSeconds
  if (data.ministryId !== undefined) updateData.ministry_id = data.ministryId || null

  const { data: preset, error } = await adminClient
    .from('agenda_item_presets')
    .update(updateData)
    .eq('id', presetId)
    .eq('church_id', profile.church_id)
    .select(`
      *,
      ministry:ministries (id, name, color)
    `)
    .single()

  if (error) {
    console.error('Error updating preset:', error)
    return { error: 'Failed to update preset' }
  }

  revalidatePath('/dashboard/settings/agenda-presets')

  return { data: preset }
}

// ============================================================================
// DELETE PRESET (soft delete)
// ============================================================================

export async function deleteAgendaPreset(presetId: string) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Only admin/owner can manage presets
  const permError = requireAdminPermission(profile.role, 'manage agenda presets')
  if (permError) return { error: permError }

  // Soft delete by setting is_active = false
  const { error } = await adminClient
    .from('agenda_item_presets')
    .update({ is_active: false })
    .eq('id', presetId)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting preset:', error)
    return { error: 'Failed to delete preset' }
  }

  revalidatePath('/dashboard/settings/agenda-presets')

  return { success: true }
}

// ============================================================================
// GET MINISTRIES (for preset form)
// ============================================================================

export async function getMinistries() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: ministries, error } = await adminClient
    .from('ministries')
    .select('id, name, color')
    .eq('church_id', profile.church_id)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching ministries:', error)
    return { error: 'Failed to load ministries' }
  }

  return { data: ministries }
}
