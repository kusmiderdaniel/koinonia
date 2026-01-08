'use client'

import { memo } from 'react'
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
  return (
    <Card className="w-full md:min-w-[28rem]">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Globe className="w-4 h-4 md:w-5 md:h-5" />
          Church Preferences
        </CardTitle>
        <CardDescription className="text-sm">Configure regional settings for your church</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={preferencesManager.timezone}
            onValueChange={preferencesManager.setTimezone}
          >
            <SelectTrigger
              id="timezone"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectValue placeholder="Select timezone" />
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
            This timezone will be used for displaying event times
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm md:text-base">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
            First Day of Week
          </Label>
          <Select
            value={preferencesManager.firstDayOfWeek.toString()}
            onValueChange={(val) => preferencesManager.setFirstDayOfWeek(parseInt(val))}
          >
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input w-full md:w-[200px]">
              <SelectValue placeholder="Select first day" />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectItem value="1">Monday</SelectItem>
              <SelectItem value="0">Sunday</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose which day the calendar week starts on
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm md:text-base">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Time Format
          </Label>
          <Select
            value={preferencesManager.timeFormat}
            onValueChange={(val) => preferencesManager.setTimeFormat(val as '12h' | '24h')}
          >
            <SelectTrigger className="bg-white dark:bg-zinc-950 border border-input w-full md:w-[200px]">
              <SelectValue placeholder="Select time format" />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectItem value="24h">24-hour (14:30)</SelectItem>
              <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose how times are displayed throughout the app
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm md:text-base">
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Default Event Visibility
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
                {preferencesManager.defaultEventVisibility === 'members' && 'All Members'}
                {preferencesManager.defaultEventVisibility === 'volunteers' && 'Volunteers+'}
                {preferencesManager.defaultEventVisibility === 'leaders' && 'Leaders+'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              className="bg-white dark:bg-zinc-950 border border-input"
            >
              <SelectItem value="members">
                <div>
                  <div>All Members</div>
                  <div className="text-xs text-muted-foreground">Visible to all church members</div>
                </div>
              </SelectItem>
              <SelectItem value="volunteers">
                <div>
                  <div>Volunteers+</div>
                  <div className="text-xs text-muted-foreground">
                    Visible to volunteers and above
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="leaders">
                <div>
                  <div>Leaders+</div>
                  <div className="text-xs text-muted-foreground">
                    Visible to leaders and admins only
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            New events will default to this visibility level
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => preferencesManager.handleSavePreferences(setError, setSuccess)}
            disabled={preferencesManager.isSavingPreferences}
            className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white w-full sm:w-auto"
          >
            {preferencesManager.isSavingPreferences ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
