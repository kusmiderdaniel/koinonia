'use server'

import { revalidatePath } from 'next/cache'
import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
} from '../helpers'

export async function getAgendaTemplates() {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const { data: templates, error } = await adminClient
    .from('agenda_item_templates')
    .select('*')
    .eq('church_id', profile.church_id)
    .order('title')

  if (error) {
    console.error('Error fetching agenda templates:', error)
    return { error: 'Failed to fetch agenda templates' }
  }

  return { data: templates || [] }
}

export async function createAgendaTemplate(title: string, defaultDurationMinutes: number) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'create templates')
  if (permError) return { error: permError }

  const { data: template, error } = await adminClient
    .from('agenda_item_templates')
    .insert({
      church_id: profile.church_id,
      title: title.trim(),
      default_duration_minutes: defaultDurationMinutes,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'An agenda item with this title already exists' }
    console.error('Error creating agenda template:', error)
    return { error: 'Failed to create template' }
  }

  return { data: template }
}

export async function addAgendaItemFromTemplate(
  eventId: string,
  templateId: string,
  ministryId: string,
  overrides?: { durationSeconds?: number; description?: string; leaderId?: string | null }
) {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  const permError = requireManagePermission(profile.role, 'add agenda items')
  if (permError) return { error: permError }

  const { data: template } = await adminClient
    .from('agenda_item_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!template) return { error: 'Template not found' }

  const { data: maxOrderItem } = await adminClient
    .from('event_agenda_items')
    .select('sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxOrderItem?.sort_order ?? -1) + 1
  const durationSeconds = overrides?.durationSeconds ?? (template.default_duration_minutes * 60)

  const { data: agendaItem, error } = await adminClient
    .from('event_agenda_items')
    .insert({
      event_id: eventId,
      title: template.title,
      description: overrides?.description || null,
      duration_seconds: durationSeconds,
      leader_id: overrides?.leaderId || null,
      ministry_id: ministryId,
      sort_order: nextSortOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding agenda item from template:', error)
    return { error: 'Failed to add agenda item' }
  }

  revalidatePath('/dashboard/events')
  return { data: agendaItem }
}
