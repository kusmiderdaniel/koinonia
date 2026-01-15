'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
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

  // Track the selected theme locally for immediate UI update
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference | null>(currentTheme)

  // Use the saved preference if set, otherwise default to 'system'
  const effectiveTheme = selectedTheme ?? currentTheme ?? 'system'

  // Sync theme with next-themes on mount
  useEffect(() => {
    setMounted(true)
    // Apply the saved theme preference on mount
    if (currentTheme) {
      setTheme(currentTheme)
    }
  }, [currentTheme, setTheme])

  const handleChange = async (value: ThemePreference) => {
    if (value === effectiveTheme) return

    // Update local state immediately for responsive UI
    setSelectedTheme(value)

    // Apply theme immediately via next-themes
    setTheme(value)

    // Save to database
    const result = await updateThemePreference(value)

    if (result.error) {
      toast.error(result.error)
      // Revert on error
      setSelectedTheme(currentTheme)
      setTheme(currentTheme ?? 'system')
    } else {
      toast.success(t('updated'))
    }
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
          <Label className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            {t('label')}
          </Label>
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
        <Label htmlFor="theme" className="flex items-center gap-2">
          {effectiveTheme === 'light' && <Sun className="h-4 w-4" />}
          {effectiveTheme === 'dark' && <Moon className="h-4 w-4" />}
          {effectiveTheme === 'system' && <Monitor className="h-4 w-4" />}
          {t('label')}
        </Label>
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
