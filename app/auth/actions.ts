'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { signInSchema, signUpSchema, resetPasswordSchema } from '@/lib/validations/auth'
import type { SignInInput, SignUpInput, ResetPasswordInput } from '@/lib/validations/auth'

/**
 * Map Supabase error messages to translation keys
 */
function mapAuthError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'invalidCredentials',
    'User already registered': 'userAlreadyRegistered',
    'Email not confirmed': 'emailNotConfirmed',
    'Password should be at least 6 characters': 'weakPassword',
    'User not found': 'accountNotFound',
  }

  // Check for exact match first
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage]
  }

  // Check for partial matches
  const lowerMessage = errorMessage.toLowerCase()
  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'userAlreadyRegistered'
  }
  if (lowerMessage.includes('invalid') && (lowerMessage.includes('credentials') || lowerMessage.includes('password'))) {
    return 'invalidCredentials'
  }
  if (lowerMessage.includes('weak') || lowerMessage.includes('password')) {
    return 'weakPassword'
  }

  // Return generic error for unknown messages
  return 'generic'
}

export async function signIn(data: SignInInput) {
  const supabase = await createClient()

  // Validate input
  const validatedData = signInSchema.parse(data)

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  redirect('/dashboard')
}

export async function signUp(data: SignUpInput) {
  const supabase = await createClient()
  const headersList = await headers()

  // Validate input
  const validatedData = signUpSchema.parse(data)

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      data: {
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  // Record consent using service role (user not authenticated yet)
  if (signUpData?.user?.id) {
    const serviceClient = createServiceRoleClient()
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      null
    const userAgent = headersList.get('user-agent') || null

    // Get current legal documents (prefer English, but any language works for consent)
    // Using limit(1) instead of single() to handle multiple language versions
    const { data: termsDocs } = await serviceClient
      .from('legal_documents')
      .select('id, version')
      .eq('document_type', 'terms_of_service')
      .eq('is_current', true)
      .order('language', { ascending: true }) // 'en' comes before 'pl'
      .limit(1)

    const { data: privacyDocs } = await serviceClient
      .from('legal_documents')
      .select('id, version')
      .eq('document_type', 'privacy_policy')
      .eq('is_current', true)
      .order('language', { ascending: true })
      .limit(1)

    const termsDoc = termsDocs?.[0]
    const privacyDoc = privacyDocs?.[0]

    // Record both consents
    const consents = [
      {
        user_id: signUpData.user.id,
        consent_type: 'terms_of_service',
        document_id: termsDoc?.id || null,
        document_version: termsDoc?.version || null,
        action: 'granted',
        ip_address: ipAddress,
        user_agent: userAgent,
      },
      {
        user_id: signUpData.user.id,
        consent_type: 'privacy_policy',
        document_id: privacyDoc?.id || null,
        document_version: privacyDoc?.version || null,
        action: 'granted',
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    ]

    await serviceClient.from('consent_records').insert(consents)
  }

  // Return success with message key for translation
  return {
    success: true,
    messageKey: 'accountCreated'
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/signin')
}

export async function resetPassword(data: ResetPasswordInput) {
  const supabase = await createClient()

  // Validate input
  const validatedData = resetPasswordSchema.parse(data)

  const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  return {
    success: true,
    messageKey: 'passwordResetSent'
  }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: mapAuthError(error.message) }
  }

  return { success: true, messageKey: 'passwordUpdated' }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: 'googleSignInFailed' }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { error: 'googleSignInFailed' }
}
