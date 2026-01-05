import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { hasPageAccess } from '@/lib/permissions'
import { FormBuilderClient } from './form-builder-client'
import type { Form, FormField, FormCondition } from '../types'

interface FormPageProps {
  params: Promise<{ id: string }>
}

export default async function FormPage({ params }: FormPageProps) {
  const { id } = await params

  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's profile with church context
  const adminClient = createServiceRoleClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, church_id, role, churches(first_day_of_week)')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const firstDayOfWeek = ((profile.churches as { first_day_of_week?: number } | null)?.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6

  // Check page access - only leaders+ can access forms
  if (!hasPageAccess(profile.role, 'forms')) {
    redirect('/dashboard')
  }

  // Fetch form with fields and conditions
  const { data: form } = await adminClient
    .from('forms')
    .select(
      `
      *,
      creator:profiles!created_by (
        id,
        first_name,
        last_name
      )
    `
    )
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .single()

  if (!form) {
    notFound()
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
  const { count: submissionsCount } = await adminClient
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', id)

  return (
    <FormBuilderClient
      initialData={{
        form: form as Form,
        fields: (fields || []) as FormField[],
        conditions: (conditions || []) as FormCondition[],
        submissionsCount: submissionsCount || 0,
        role: profile.role,
        firstDayOfWeek,
      }}
    />
  )
}
