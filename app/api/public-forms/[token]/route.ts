import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from '@/lib/rate-limit'

interface RouteContext {
  params: Promise<{ token: string }>
}

// GET - Fetch form data for public access
export async function GET(request: Request, context: RouteContext) {
  // Rate limit - relaxed for read operations
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'relaxed')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const { token } = await context.params
    const adminClient = createServiceRoleClient()

    // Get form by public token
    const { data: form, error: formError } = await adminClient
      .from('forms')
      .select('id, title, description, status, access_type')
      .eq('public_token', token)
      .eq('access_type', 'public')
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (form.status !== 'published') {
      return NextResponse.json(
        { error: 'This form is not accepting responses' },
        { status: 400 }
      )
    }

    // Get fields
    const { data: fields } = await adminClient
      .from('form_fields')
      .select('id, type, label, description, placeholder, required, options, sort_order')
      .eq('form_id', form.id)
      .order('sort_order')

    // Get conditions
    const { data: conditions } = await adminClient
      .from('form_conditions')
      .select('id, target_field_id, source_field_id, operator, value, action')
      .eq('form_id', form.id)

    return NextResponse.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
      },
      fields: fields || [],
      conditions: conditions || [],
    })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}

// POST - Submit form response
export async function POST(request: Request, context: RouteContext) {
  // Rate limit - strict for submissions to prevent spam
  const identifier = getClientIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, 'strict')
  if (!rateLimit.success) {
    return rateLimitedResponse(rateLimit)
  }

  try {
    const { token } = await context.params
    const body = await request.json()
    const { responses, email } = body

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })
    }

    const adminClient = createServiceRoleClient()

    // Get form by public token
    const { data: form, error: formError } = await adminClient
      .from('forms')
      .select('id, status, access_type')
      .eq('public_token', token)
      .eq('access_type', 'public')
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    if (form.status !== 'published') {
      return NextResponse.json(
        { error: 'This form is not accepting responses' },
        { status: 400 }
      )
    }

    // Get request headers for tracking
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || null
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0].trim() : null

    // Create submission
    const { data: submission, error: submitError } = await adminClient
      .from('form_submissions')
      .insert({
        form_id: form.id,
        responses,
        respondent_email: email || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (submitError) {
      console.error('Error creating submission:', submitError)
      return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
    }

    return NextResponse.json({ success: true, submissionId: submission.id })
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
  }
}
