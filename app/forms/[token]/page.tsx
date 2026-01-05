import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PublicFormClient } from './PublicFormClient'

interface PublicFormPageProps {
  params: Promise<{ token: string }>
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  const { token } = await params
  const adminClient = createServiceRoleClient()

  // Get form by public token (include church for first_day_of_week)
  const { data: form } = await adminClient
    .from('forms')
    .select('id, title, description, status, access_type, churches(first_day_of_week)')
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

  // Get fields
  const { data: fields } = await adminClient
    .from('form_fields')
    .select('id, type, label, description, placeholder, required, options, settings, sort_order')
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
        description: form.description,
      }}
      fields={fields || []}
      conditions={conditions || []}
      weekStartsOn={firstDayOfWeek}
    />
  )
}
