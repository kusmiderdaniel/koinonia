'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateThemePreference, type ThemePreference } from '../actions'

interface AppearanceSettingsCardProps {
  currentTheme: ThemePreference | null
}

const themeOptions: { value: ThemePreference; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

export function AppearanceSettingsCard({ currentTheme }: AppearanceSettingsCardProps) {
  const t = useTranslations('profile.appearance')
  const { setTheme, theme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  // Use theme from next-themes as source of truth (persists in localStorage)
  // Fall back to database value only on first load when next-themes hasn't initialized
  const effectiveTheme = (theme as ThemePreference) ?? currentTheme ?? 'system'

  // Only set mounted state - don't override theme from next-themes
  useEffect(() => {
    setMounted(true)
    // Only sync from database if next-themes doesn't have a value yet
    // This happens on very first visit before any theme was set
    if (!theme && currentTheme) {
      setTheme(currentTheme)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- Only sync from DB on initial mount

  const handleChange = (value: ThemePreference) => {
    if (value === effectiveTheme) return

    // Apply theme via next-themes (updates localStorage and DOM)
    setTheme(value)

    // Save to database in background (non-blocking)
    startTransition(async () => {
      const result = await updateThemePreference(value)

      if (result.error) {
        toast.error(result.error)
        // Revert on error
        setTheme(currentTheme ?? 'system')
      }
    })
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="space-y-2">
          <div className="w-48 h-10 bg-muted animate-pulse rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="space-y-2">
        <Select
          value={effectiveTheme}
          onValueChange={handleChange}
          disabled={isPending}
        >
          <SelectTrigger id="theme" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-black dark:border-white">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {t(`options.${option.value}`)}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
