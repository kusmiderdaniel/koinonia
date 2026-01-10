/**
 * Internationalization configuration
 *
 * This file defines the supported locales and default locale for the application.
 * To add a new language:
 * 1. Add the locale code to the `locales` array
 * 2. Add the locale name to `localeNames`
 * 3. Add the date-fns locale import to `dateFnsLocales` (if needed)
 * 4. Update the database constraint: ALTER TABLE profiles DROP CONSTRAINT profiles_language_check;
 *    Then: ALTER TABLE profiles ADD CONSTRAINT profiles_language_check CHECK (language IS NULL OR language IN ('en', 'pl', 'new_lang'));
 * 5. Create translation files in /messages/[new_lang]/
 */

export const locales = ['en', 'pl'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pl: 'Polski',
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}
