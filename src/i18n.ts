import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['pl', 'en'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'pl';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is set by setRequestLocale() in the layout
  let locale = await requestLocale;

  // Fallback to default if not set
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
