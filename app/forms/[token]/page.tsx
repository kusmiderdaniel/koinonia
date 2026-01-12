import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PublicFormClient } from './PublicFormClient'

// Force dynamic rendering to always fetch fresh data
export const dynamic = 'force-dynamic'

interface PublicFormPageProps {
  params: Promise<{ token: string }>
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { token } = await params
  const adminClient = createServiceRoleClient()

  // Get form by public token (include church for first_day_of_week)
  const { data: form } = await adminClient
    .from('forms')
    .select('id, title, title_i18n, description, description_i18n, status, access_type, is_multilingual, churches(first_day_of_week)')
    .eq('public_token', token)
    .eq('access_type', 'public')
    .single()

  if (!form) {
    notFound()
  }

  if (form.status !== 'published') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Form Unavailable</h1>
          <p className="text-muted-foreground">
            This form is not currently accepting responses.
          </p>
        </div>
      </div>
    )
  }

  // Get fields (include i18n columns for multilingual forms)
  const { data: fields } = await adminClient
    .from('form_fields')
    .select('id, type, label, label_i18n, description, description_i18n, placeholder, placeholder_i18n, required, options, options_i18n, settings, sort_order')
    .eq('form_id', form.id)
    .order('sort_order')

  // Get conditions
  const { data: conditions } = await adminClient
    .from('form_conditions')
    .select('id, target_field_id, source_field_id, operator, value, action')
    .eq('form_id', form.id)

  // Get first day of week from church preferences
  const firstDayOfWeek = ((form.churches as { first_day_of_week?: number } | null)?.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6

  return (
    <PublicFormClient
      token={token}
      form={{
        id: form.id,
        title: form.title,
        title_i18n: form.title_i18n,
        description: form.description,
        description_i18n: form.description_i18n,
        is_multilingual: form.is_multilingual,
      }}
      fields={fields || []}
      conditions={conditions || []}
      weekStartsOn={firstDayOfWeek}
    />
  )
}
