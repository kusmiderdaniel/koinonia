'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Globe, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { locales, localeNames, type Locale } from '@/lib/i18n/config'
import { setLocaleCookie, updateUserLanguagePreference } from '@/lib/i18n/actions'

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'icon'
  showLabel?: boolean
  /** If true, also updates the database (for logged-in users) */
  updateDatabase?: boolean
}

export function LanguageSwitcher({
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
  updateDatabase = false,
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === locale) return

    // Always set the cookie for immediate UI update
    await setLocaleCookie(newLocale)

    // Also update the database if requested (for logged-in users)
    if (updateDatabase) {
      await updateUserLanguagePreference(newLocale)
    }

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isPending}>
          <Globe className="h-4 w-4" />
          {showLabel && <span className="ml-2">{localeNames[locale]}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="cursor-pointer"
          >
            <span className="flex-1">{localeNames[loc]}</span>
            {locale === loc && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
