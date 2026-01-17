'use client'

import { cn } from '@/lib/utils'
import { locales, localeNames, localeShortNames, type Locale } from '@/lib/i18n/config'

interface LanguageTabsProps {
  activeLocale: Locale
  onLocaleChange: (locale: Locale) => void
  /** Optional: show indicator for locales with missing content */
  missingLocales?: Locale[]
  /** Use short labels (EN, PL) instead of full names */
  shortLabels?: boolean
  className?: string
}

export function LanguageTabs({
  activeLocale,
  onLocaleChange,
  missingLocales = [],
  shortLabels = false,
  className,
}: LanguageTabsProps) {
  const labels = shortLabels ? localeShortNames : localeNames

  return (
    <div className={cn('flex gap-1 p-1 bg-muted rounded-lg', className)}>
      {locales.map((locale) => {
        const isActive = locale === activeLocale
        const isMissing = missingLocales.includes(locale)

        return (
          <button
            key={locale}
            type="button"
            onClick={() => onLocaleChange(locale)}
            className={cn(
              'relative px-3 py-1 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-brand text-black shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {labels[locale]}
            {isMissing && !isActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
