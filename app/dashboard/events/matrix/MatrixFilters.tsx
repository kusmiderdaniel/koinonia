'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import type { MatrixMinistry, MatrixCampus } from './types'

const EVENT_TYPES = [
  { value: 'service', label: 'Service' },
  { value: 'rehearsal', label: 'Rehearsal' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'special_event', label: 'Special Event' },
  { value: 'other', label: 'Other' },
]

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
  const [ministryDropdownOpen, setMinistryDropdownOpen] = useState(false)

  const handleMinistryToggle = (ministryId: string, checked: boolean) => {
    if (checked) {
      onMinistriesChange([...selectedMinistryIds, ministryId])
    } else {
      onMinistriesChange(selectedMinistryIds.filter((id) => id !== ministryId))
    }
  }

  const selectedMinistriesLabel = selectedMinistryIds.length === 0
    ? 'All Ministries'
    : selectedMinistryIds.length === 1
      ? ministries.find((m) => m.id === selectedMinistryIds[0])?.name || '1 ministry'
      : `${selectedMinistryIds.length} ministries`

  return (
    <div className="flex flex-wrap items-end gap-3 bg-white dark:bg-zinc-950">
      {/* Campus Filter */}
      {campuses.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Campus</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-between !border-black dark:!border-white">
                {selectedCampusId
                  ? campuses.find((c) => c.id === selectedCampusId)?.name || 'All Campuses'
                  : 'All Campuses'}
                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px]" align="start">
              <DropdownMenuRadioGroup
                value={selectedCampusId || 'all'}
                onValueChange={(value) => onCampusChange(value === 'all' ? null : value)}
              >
                <DropdownMenuRadioItem value="all">All Campuses</DropdownMenuRadioItem>
                {campuses.map((campus) => (
                  <DropdownMenuRadioItem key={campus.id} value={campus.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: campus.color }}
                      />
                      {campus.name}
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Ministry Filter (Multi-select) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Ministry</label>
        <DropdownMenu open={ministryDropdownOpen} onOpenChange={setMinistryDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between !border-black dark:!border-white">
              {selectedMinistriesLabel}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]" align="start">
            {ministries.map((ministry) => (
              <DropdownMenuCheckboxItem
                key={ministry.id}
                checked={selectedMinistryIds.includes(ministry.id)}
                onCheckedChange={(checked) => handleMinistryToggle(ministry.id, checked)}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ministry.color }}
                  />
                  {ministry.name}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
            {ministries.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No ministries found
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Event Type Filter */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Event Type</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[160px] justify-between !border-black dark:!border-white">
              {selectedEventType
                ? EVENT_TYPES.find((t) => t.value === selectedEventType)?.label || 'All Types'
                : 'All Types'}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[160px]" align="start">
            <DropdownMenuRadioGroup
              value={selectedEventType || 'all'}
              onValueChange={(value) => onEventTypeChange(value === 'all' ? null : value)}
            >
              <DropdownMenuRadioItem value="all">All Types</DropdownMenuRadioItem>
              {EVENT_TYPES.map((type) => (
                <DropdownMenuRadioItem key={type.value} value={type.value}>
                  {type.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
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
          Clear filters
        </Button>
      )}
    </div>
  )
}
