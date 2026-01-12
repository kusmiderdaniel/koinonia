'use client'

import { useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MatrixMinistry, MatrixCampus } from './types'

const EVENT_TYPE_VALUES = ['service', 'rehearsal', 'meeting', 'special_event', 'other'] as const

interface MatrixFiltersProps {
  campuses: MatrixCampus[]
  ministries: MatrixMinistry[]
  selectedCampusId: string | null
  selectedMinistryIds: string[]
  selectedEventType: string | null
  onCampusChange: (campusId: string | null) => void
  onMinistriesChange: (ministryIds: string[]) => void
  onEventTypeChange: (eventType: string | null) => void
}

export function MatrixFilters({
  campuses,
  ministries,
  selectedCampusId,
  selectedMinistryIds,
  selectedEventType,
  onCampusChange,
  onMinistriesChange,
  onEventTypeChange,
}: MatrixFiltersProps) {
  const t = useTranslations('events')
  const [ministryDropdownOpen, setMinistryDropdownOpen] = useState(false)

  const handleMinistryToggle = useCallback((ministryId: string, checked: boolean) => {
    if (checked) {
      onMinistriesChange([...selectedMinistryIds, ministryId])
    } else {
      onMinistriesChange(selectedMinistryIds.filter((id) => id !== ministryId))
    }
  }, [selectedMinistryIds, onMinistriesChange])

  const selectedMinistriesLabel = useMemo(() => {
    if (selectedMinistryIds.length === 0) return t('matrix.allMinistries')
    if (selectedMinistryIds.length === 1) {
      return ministries.find((m) => m.id === selectedMinistryIds[0])?.name || t('matrix.oneMinistry')
    }
    return t('matrix.ministriesCount', { count: selectedMinistryIds.length })
  }, [selectedMinistryIds, ministries, t])

  return (
    <div className="flex flex-wrap items-end gap-3 bg-white dark:bg-zinc-950">
      {/* Campus Filter */}
      {campuses.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{t('form.campusLabel')}</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[140px] max-w-[200px] justify-between !border-black dark:!border-white">
                <span className="truncate">
                  {selectedCampusId
                    ? campuses.find((c) => c.id === selectedCampusId)?.name || t('matrix.allCampuses')
                    : t('matrix.allCampuses')}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]" align="start">
              <DropdownMenuItem
                className={cn(!selectedCampusId && 'bg-zinc-200 dark:bg-zinc-700')}
                onClick={() => onCampusChange(null)}
              >
                {t('matrix.allCampuses')}
              </DropdownMenuItem>
              {campuses.map((campus) => (
                <DropdownMenuItem
                  key={campus.id}
                  className={cn(selectedCampusId === campus.id && 'bg-zinc-200 dark:bg-zinc-700')}
                  onClick={() => onCampusChange(campus.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: campus.color }}
                    />
                    {campus.name}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Ministry Filter (Multi-select) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">{t('matrix.ministryLabel')}</label>
        <DropdownMenu open={ministryDropdownOpen} onOpenChange={setMinistryDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between !border-black dark:!border-white">
              {selectedMinistriesLabel}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]" align="start">
            <DropdownMenuItem
              className={cn(selectedMinistryIds.length === 0 && 'bg-zinc-200 dark:bg-zinc-700')}
              onClick={() => onMinistriesChange([])}
              onSelect={(e) => e.preventDefault()}
            >
              {t('matrix.allMinistries')}
            </DropdownMenuItem>
            {ministries.map((ministry) => (
              <DropdownMenuItem
                key={ministry.id}
                className={cn(selectedMinistryIds.includes(ministry.id) && 'bg-zinc-200 dark:bg-zinc-700')}
                onClick={() => handleMinistryToggle(ministry.id, !selectedMinistryIds.includes(ministry.id))}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ministry.color }}
                  />
                  {ministry.name}
                </div>
              </DropdownMenuItem>
            ))}
            {ministries.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {t('matrix.noMinistries')}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Event Type Filter */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">{t('fields.type')}</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[160px] justify-between !border-black dark:!border-white">
              {selectedEventType
                ? t(`types.${selectedEventType}`)
                : t('matrix.allTypes')}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[160px]" align="start">
            <DropdownMenuItem
              className={cn(!selectedEventType && 'bg-zinc-200 dark:bg-zinc-700')}
              onClick={() => onEventTypeChange(null)}
            >
              {t('matrix.allTypes')}
            </DropdownMenuItem>
            {EVENT_TYPE_VALUES.map((type) => (
              <DropdownMenuItem
                key={type}
                className={cn(selectedEventType === type && 'bg-zinc-200 dark:bg-zinc-700')}
                onClick={() => onEventTypeChange(type)}
              >
                {t(`types.${type}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Clear filters */}
      {(selectedCampusId || selectedMinistryIds.length > 0 || selectedEventType) && (
        <Button
          variant="ghost"
          size="sm"
          className="self-end"
          onClick={() => {
            onCampusChange(null)
            onMinistriesChange([])
            onEventTypeChange(null)
          }}
        >
          {t('matrix.clearFilters')}
        </Button>
      )}
    </div>
  )
}
