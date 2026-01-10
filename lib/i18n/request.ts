import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { defaultLocale, isValidLocale, type Locale } from './config'

/**
 * Server-side locale detection for next-intl
 *
 * Priority order:
 * 1. Authenticated user's language preference from profiles table
 * 2. NEXT_LOCALE cookie (set by language switcher for public pages)
 * 3. Accept-Language header (browser detection)
 * 4. Default locale (English)
 */
export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale

  try {
    // 1. Check if user is authenticated and has a language preference
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('user_id', user.id)
        .single()

      if (profile?.language && isValidLocale(profile.language)) {
        locale = profile.language
        // User has explicit preference, use it
        const messages = (await import(`@/messages/${locale}`)).default
        return { locale, messages }
      }
    }

    // 2. Check cookie (for all users without a profile language preference)
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

    if (cookieLocale && isValidLocale(cookieLocale)) {
      locale = cookieLocale
    } else {
      // 3. Browser detection from Accept-Language header
      const headersList = await headers()
      const acceptLanguage = headersList.get('accept-language')

      if (acceptLanguage) {
        // Parse Accept-Language header (e.g., "pl-PL,pl;q=0.9,en;q=0.8")
        const browserLocales = acceptLanguage
          .split(',')
          .map((lang) => lang.split(';')[0].trim().split('-')[0])

        for (const browserLocale of browserLocales) {
          if (isValidLocale(browserLocale)) {
            locale = browserLocale
            break
          }
        }
      }
    }
  } catch (error) {
    // If anything fails, use default locale
    console.error('Error detecting locale:', error)
  }

  // Load messages for the detected locale
  const messages = (await import(`@/messages/${locale}`)).default

  return {
    locale,
    messages,
  }
})
