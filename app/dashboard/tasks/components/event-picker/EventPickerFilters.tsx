'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown } from 'lucide-react'
import { EVENT_TYPE_LABELS } from '@/lib/constants/event'
import type { Campus } from './types'

// Event Type Filter Popover
interface EventTypeFilterProps {
  selectedTypes: string[]
  onToggle: (type: string) => void
  onClear: () => void
}

export function EventTypeFilter({ selectedTypes, onToggle, onClear }: EventTypeFilterProps) {
  const [open, setOpen] = useState(false)

  const getLabel = () => {
    if (selectedTypes.length === 0) return 'All Types'
    if (selectedTypes.length === 1) return EVENT_TYPE_LABELS[selectedTypes[0]] || selectedTypes[0]
    return `${selectedTypes.length} types`
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
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Checkbox
                checked={selectedTypes.includes(value)}
                onCheckedChange={() => onToggle(value)}
              />
              <span className="text-sm">{label}</span>
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
            Clear selection
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
  const [open, setOpen] = useState(false)

  const getLabel = () => {
    if (selectedCampuses.length === 0) return 'All Campuses'
    if (selectedCampuses.length === 1) {
      const campus = campuses.find((c) => c.id === selectedCampuses[0])
      return campus?.name || 'Campus'
    }
    return `${selectedCampuses.length} campuses`
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
            Clear selection
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
