import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isLeaderOrAbove } from '@/lib/permissions'
import { verifyChurchOwnership } from '@/lib/utils/server-auth'
import { format } from 'date-fns'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  // Rate limit - standard for authenticated operations
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'standard')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const { id: formId } = await context.params

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const adminClient = createServiceRoleClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, church_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check permission - only leaders+ can export
    if (!isLeaderOrAbove(profile.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get form and verify ownership
    const { data: form, error: ownershipError } = await verifyChurchOwnership<{
      church_id: string; id: string; title: string
    }>(adminClient, 'forms', formId, profile.church_id, 'id, title, church_id', 'Form not found')
    if (ownershipError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Get fields - inner join with forms to verify church ownership (defense in depth)
    const { data: fields } = await adminClient
      .from('form_fields')
      .select(`
        id,
        label,
        type,
        form:forms!inner (church_id)
      `)
      .eq('form_id', formId)
      .eq('form.church_id', profile.church_id)
      .order('sort_order')

    if (!fields || fields.length === 0) {
      return NextResponse.json({ error: 'No fields found' }, { status: 400 })
    }

    // Get submissions - inner join with forms to verify church ownership (defense in depth)
    const { data: submissions } = await adminClient
      .from('form_submissions')
      .select(`
        id,
        responses,
        submitted_at,
        respondent_email,
        respondent:profiles!respondent_id (
          first_name,
          last_name,
          email
        ),
        form:forms!inner (church_id)
      `)
      .eq('form_id', formId)
      .eq('form.church_id', profile.church_id)
      .order('submitted_at', { ascending: false })

    // Build CSV
    const headers = ['Submitted At', 'Respondent', ...fields.map((f) => f.label)]

    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const formatFieldValue = (type: string, value: unknown): string => {
      if (value === null || value === undefined || value === '') return ''

      switch (type) {
        case 'checkbox':
          return value ? 'Yes' : 'No'
        case 'multi_select':
          if (Array.isArray(value)) {
            return value.join('; ')
          }
          return String(value)
        case 'date':
          try {
            return format(new Date(value as string), 'dd/MM/yyyy')
          } catch {
            return String(value)
          }
        default:
          return String(value)
      }
    }

    const rows = (submissions || []).map((submission) => {
      const respondent = submission.respondent as { first_name?: string; last_name?: string; email?: string } | null
      const respondentName = respondent
        ? `${respondent.first_name || ''} ${respondent.last_name || ''}`.trim() || respondent.email
        : submission.respondent_email || 'Anonymous'

      const submittedAt = submission.submitted_at
        ? format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm')
        : ''

      const fieldValues = fields.map((field) => {
        const responses = submission.responses as Record<string, unknown>
        return formatFieldValue(field.type, responses[field.id])
      })

      return [submittedAt, respondentName, ...fieldValues].map(escapeCSV).join(',')
    })

    const csv = [headers.map(escapeCSV).join(','), ...rows].join('\n')

    // Create response with CSV - add UTF-8 BOM for Excel compatibility
    const filename = `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}-responses.csv`
    const BOM = '\uFEFF'
    const csvWithBOM = BOM + csv

    return new Response(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
