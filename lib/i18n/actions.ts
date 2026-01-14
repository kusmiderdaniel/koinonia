'use server'

import { cookies } from 'next/headers'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isValidLocale, type Locale } from './config'

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * Set the locale cookie for unauthenticated users
 * Used by the language switcher on public/auth pages
 */
export async function setLocaleCookie(locale: Locale): Promise<{ success: boolean }> {
  if (!isValidLocale(locale)) {
    return { success: false }
  }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return { success: true }
}

/**
 * Get the current locale from cookie
 */
export async function getLocaleCookie(): Promise<Locale | null> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value

  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue
  }

  return null
}

/**
 * Update the user's language preference in the database
 * Used by the language switcher for logged-in users
 */
export async function updateUserLanguagePreference(locale: Locale): Promise<{ success: boolean; error?: string }> {
  if (!isValidLocale(locale)) {
    return { success: false, error: 'Invalid locale' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in, just use cookie (already set by setLocaleCookie)
    return { success: true }
  }

  const adminClient = createServiceRoleClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ language: locale })
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating language preference:', error)
    return { success: false, error: 'Failed to update language' }
  }

  return { success: true }
}
