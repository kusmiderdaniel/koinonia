'use client'

import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Users2, Briefcase } from 'lucide-react'
import type { ScopeSelectorProps, BulkInvitationScope } from './types'

export function ScopeSelector({
  scope,
  onScopeChange,
  pendingCounts,
  selectedDates,
  selectedEventIds,
  selectedMinistryIds,
  selectedPositionIds,
  onToggleDate,
  onToggleEvent,
  onToggleMinistry,
  onTogglePosition,
}: ScopeSelectorProps) {
  const t = useTranslations('events.invitationsDialog')

  return (
    <RadioGroup
      value={scope}
      onValueChange={(v: string) => onScopeChange(v as BulkInvitationScope)}
    >
      {/* All */}
      <div className="flex items-center space-x-2 p-3 border border-black/20 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900">
        <RadioGroupItem value="all" id="scope-all" />
        <Label htmlFor="scope-all" className="flex-1 cursor-pointer">
          <span className="font-medium">{t('allPending')}</span>
          <span className="text-sm text-muted-foreground ml-2">
            ({pendingCounts.total})
          </span>
        </Label>
      </div>

      {/* By Date */}
      {pendingCounts.byDate.length > 0 && (
        <div className="border border-black/20 dark:border-white/20 rounded-lg overflow-hidden">
          <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
            <RadioGroupItem value="dates" id="scope-dates" />
            <Label
              htmlFor="scope-dates"
              className="flex-1 cursor-pointer font-medium flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {t('byDate')}
            </Label>
          </div>

          {scope === 'dates' && (
            <ScrollArea className="max-h-40 px-3 pb-3">
              <div className="space-y-2">
                {pendingCounts.byDate.map(({ date, eventIds, count }) => (
                  <div
                    key={date}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <Checkbox
                      id={`date-${date}`}
                      checked={selectedDates.includes(date)}
                      onCheckedChange={() => onToggleDate(date)}
                    />
                    <Label
                      htmlFor={`date-${date}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <span className="font-medium">
                        {format(new Date(date), 'EEEE, MMM d')}
                      </span>
                      {eventIds.length > 1 && (
                        <span className="text-muted-foreground ml-2">
                          ({eventIds.length} {t('events')})
                        </span>
                      )}
                    </Label>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* By Ministry */}
      {pendingCounts.byMinistry.length > 0 && (
        <div className="border border-black/20 dark:border-white/20 rounded-lg overflow-hidden">
          <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
            <RadioGroupItem value="ministries" id="scope-ministries" />
            <Label
              htmlFor="scope-ministries"
              className="flex-1 cursor-pointer font-medium flex items-center gap-2"
            >
              <Users2 className="w-4 h-4" />
              {t('byMinistry')}
            </Label>
          </div>

          {scope === 'ministries' && (
            <ScrollArea className="max-h-40 px-3 pb-3">
              <div className="space-y-2">
                {pendingCounts.byMinistry.map(({ ministry, count }) => (
                  <div
                    key={ministry.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <Checkbox
                      id={`ministry-${ministry.id}`}
                      checked={selectedMinistryIds.includes(ministry.id)}
                      onCheckedChange={() => onToggleMinistry(ministry.id)}
                    />
                    <Label
                      htmlFor={`ministry-${ministry.id}`}
                      className="flex-1 cursor-pointer text-sm flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ministry.color }}
                      />
                      {ministry.name}
                    </Label>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* By Position/Role */}
      {pendingCounts.byPosition.length > 0 && (
        <div className="border border-black/20 dark:border-white/20 rounded-lg overflow-hidden">
          <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
            <RadioGroupItem value="positions" id="scope-positions" />
            <Label
              htmlFor="scope-positions"
              className="flex-1 cursor-pointer font-medium flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              {t('byRole')}
            </Label>
          </div>

          {scope === 'positions' && (
            <ScrollArea className="max-h-40 px-3 pb-3">
              <div className="space-y-2">
                {pendingCounts.byPosition.map(({ position, count }) => (
                  <div
                    key={position.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <Checkbox
                      id={`position-${position.id}`}
                      checked={selectedPositionIds.includes(position.id)}
                      onCheckedChange={() => onTogglePosition(position.id)}
                    />
                    <Label
                      htmlFor={`position-${position.id}`}
                      className="flex-1 cursor-pointer text-sm flex items-center gap-2"
                    >
                      {position.ministry && (
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: position.ministry.color }}
                          title={position.ministry.name}
                        />
                      )}
                      <span>{position.title}</span>
                      {position.ministry && (
                        <span className="text-xs text-muted-foreground">
                          ({position.ministry.name})
                        </span>
                      )}
                    </Label>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </RadioGroup>
  )
}
