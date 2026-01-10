'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import type { Campus } from './types'

const EVENT_TYPES = ['service', 'rehearsal', 'meeting', 'special_event', 'other'] as const

// Event Type Filter Popover
interface EventTypeFilterProps {
  selectedTypes: string[]
  onToggle: (type: string) => void
  onClear: () => void
}

export function EventTypeFilter({ selectedTypes, onToggle, onClear }: EventTypeFilterProps) {
  const t = useTranslations('tasks')
  const tEvents = useTranslations('events')
  const [open, setOpen] = useState(false)

  const getLabel = () => {
    if (selectedTypes.length === 0) return t('eventPicker.allTypes')
    if (selectedTypes.length === 1) return tEvents(`types.${selectedTypes[0]}`)
    return t('eventPicker.typesCount', { count: selectedTypes.length })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between !bg-white dark:!bg-zinc-950 text-sm !border !border-input rounded-full hover:!bg-gray-100 dark:hover:!bg-zinc-800 transition-colors font-normal"
        >
          <span className="truncate">{getLabel()}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-white dark:bg-zinc-950 border border-input" align="start">
        <div className="space-y-1">
          {EVENT_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Checkbox
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => onToggle(type)}
              />
              <span className="text-sm">{tEvents(`types.${type}`)}</span>
            </label>
          ))}
        </div>
        {selectedTypes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={onClear}
          >
            {t('eventPicker.clearSelection')}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Campus Filter Popover
interface CampusFilterProps {
  campuses: Campus[]
  selectedCampuses: string[]
  onToggle: (campusId: string) => void
  onClear: () => void
}

export function CampusFilter({ campuses, selectedCampuses, onToggle, onClear }: CampusFilterProps) {
  const t = useTranslations('tasks')
  const [open, setOpen] = useState(false)

  const getLabel = () => {
    if (selectedCampuses.length === 0) return t('eventPicker.allCampuses')
    if (selectedCampuses.length === 1) {
      const campus = campuses.find((c) => c.id === selectedCampuses[0])
      return campus?.name || t('columns.campus')
    }
    return t('eventPicker.campusesCount', { count: selectedCampuses.length })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between !bg-white dark:!bg-zinc-950 text-sm !border !border-input rounded-full hover:!bg-gray-100 dark:hover:!bg-zinc-800 transition-colors font-normal"
        >
          <span className="truncate">{getLabel()}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-white dark:bg-zinc-950 border border-input" align="start">
        <div className="space-y-1">
          {campuses.map((campus) => (
            <label
              key={campus.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Checkbox
                checked={selectedCampuses.includes(campus.id)}
                onCheckedChange={() => onToggle(campus.id)}
              />
              <span className="flex items-center gap-2 text-sm">
                {campus.color && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: campus.color }}
                  />
                )}
                {campus.name}
              </span>
            </label>
          ))}
        </div>
        {selectedCampuses.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={onClear}
          >
            {t('eventPicker.clearSelection')}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
