'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Globe, Calendar, Clock, Eye } from 'lucide-react'
import type { usePreferencesManager } from '../hooks'
import { TIMEZONE_OPTIONS } from '../types'

interface PreferencesTabProps {
  preferencesManager: ReturnType<typeof usePreferencesManager>
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const PreferencesTab = memo(function PreferencesTab({
  preferencesManager,
  setError,
  setSuccess,
}: PreferencesTabProps) {
  const t = useTranslations('settings.preferences')
  return (
    <Card className="w-full md:min-w-[28rem] border-0 shadow-none !ring-0">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Globe className="w-4 h-4 md:w-5 md:h-5" />
          {t('title')}
        </CardTitle>
        <CardDescription className="text-sm">{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="timezone">{t('timezone.label')}</Label>
          <Select
            value={preferencesManager.timezone}
            onValueChange={preferencesManager.setTimezone}
          >
            <SelectTrigger
              id="timezone"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectValue placeholder={t('timezone.placeholder')} />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input max-h-[300px]"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('timezone.hint')}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm md:text-base">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('firstDayOfWeek.label')}
          </Label>
          <Select
            value={preferencesManager.firstDayOfWeek.toString()}
            onValueChange={(val) => preferencesManager.setFirstDayOfWeek(parseInt(val))}
          >
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input w-full md:w-[200px]">
              <SelectValue placeholder={t('firstDayOfWeek.placeholder')} />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectItem value="1">{t('firstDayOfWeek.monday')}</SelectItem>
              <SelectItem value="0">{t('firstDayOfWeek.sunday')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('firstDayOfWeek.hint')}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm md:text-base">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('timeFormat.label')}
          </Label>
          <Select
            value={preferencesManager.timeFormat}
            onValueChange={(val) => preferencesManager.setTimeFormat(val as '12h' | '24h')}
          >
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input w-full md:w-[200px]">
              <SelectValue placeholder={t('timeFormat.placeholder')} />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectItem value="24h">{t('timeFormat.24h')}</SelectItem>
              <SelectItem value="12h">{t('timeFormat.12h')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('timeFormat.hint')}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm md:text-base">
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('eventVisibility.label')}
          </Label>
          <Select
            value={preferencesManager.defaultEventVisibility}
            onValueChange={(val) =>
              preferencesManager.setDefaultEventVisibility(
                val as 'members' | 'volunteers' | 'leaders'
              )
            }
          >
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input w-full md:w-[250px]">
              <SelectValue placeholder="Select visibility">
                {preferencesManager.defaultEventVisibility === 'members' && t('eventVisibility.members')}
                {preferencesManager.defaultEventVisibility === 'volunteers' && t('eventVisibility.volunteers')}
                {preferencesManager.defaultEventVisibility === 'leaders' && t('eventVisibility.leaders')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectItem value="members">
                <div>
                  <div>{t('eventVisibility.members')}</div>
                  <div className="text-xs text-muted-foreground">{t('eventVisibility.membersDescription')}</div>
                </div>
              </SelectItem>
              <SelectItem value="volunteers">
                <div>
                  <div>{t('eventVisibility.volunteers')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('eventVisibility.volunteersDescription')}
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="leaders">
                <div>
                  <div>{t('eventVisibility.leaders')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('eventVisibility.leadersDescription')}
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t('eventVisibility.hint')}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => preferencesManager.handleSavePreferences(setError, setSuccess)}
            disabled={preferencesManager.isSavingPreferences}
            className="!rounded-lg !border !border-brand !bg-brand hover:!bg-brand/90 !text-white dark:!text-black w-full sm:w-auto"
          >
            {preferencesManager.isSavingPreferences ? t('saving') : t('savePreferences')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
