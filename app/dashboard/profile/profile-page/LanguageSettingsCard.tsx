'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Globe } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import { updateLanguagePreference } from '../actions'
import { setLocaleCookie } from '@/lib/i18n/actions'

interface LanguageSettingsCardProps {
  currentLanguage: Locale | null
}

export function LanguageSettingsCard({ currentLanguage }: LanguageSettingsCardProps) {
  const t = useTranslations('profile.language')
  const detectedLocale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Track the selected language locally for immediate UI update
  const [selectedLanguage, setSelectedLanguage] = useState<Locale | null>(currentLanguage)

  // Use the saved preference if set, otherwise show the detected locale
  const effectiveLanguage = selectedLanguage ?? currentLanguage ?? detectedLocale

  const handleChange = async (value: Locale) => {
    if (value === effectiveLanguage) return

    // Update local state immediately for responsive UI
    setSelectedLanguage(value)

    // Update both the database and the cookie for consistency
    const [dbResult] = await Promise.all([
      updateLanguagePreference(value),
      setLocaleCookie(value),
    ])

    if (dbResult.error) {
      toast.error(dbResult.error)
      // Revert on error
      setSelectedLanguage(currentLanguage)
    } else {
      toast.success(t('updated'))
      startTransition(() => {
        router.refresh()
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {t('label')}
        </Label>
        <Select
          value={effectiveLanguage}
          onValueChange={handleChange}
          disabled={isPending}
        >
          <SelectTrigger id="language" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-black dark:border-white">
            {locales.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {localeNames[loc]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
