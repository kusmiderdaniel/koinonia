'use server'

import { cookies } from 'next/headers'
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
