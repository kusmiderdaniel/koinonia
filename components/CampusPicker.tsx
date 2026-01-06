'use client'

import { memo, useState, useEffect } from 'react'
import { Check, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CampusBadge, CampusBadges } from './CampusBadge'
import { cn } from '@/lib/utils'

export interface CampusOption {
  id: string
  name: string
  color: string
  is_default?: boolean
}

interface CampusPickerProps {
  campuses: CampusOption[]
  selectedCampusIds: string[]
  onChange: (campusIds: string[]) => void
  multiple?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const CampusPicker = memo(function CampusPicker({
  campuses,
  selectedCampusIds,
  onChange,
  multiple = true,
  placeholder = 'Select campus...',
  disabled = false,
  className,
}: CampusPickerProps) {
  const [open, setOpen] = useState(false)

  const selectedCampuses = campuses.filter(c => selectedCampusIds.includes(c.id))

  const handleToggle = (campusId: string) => {
    if (multiple) {
      if (selectedCampusIds.includes(campusId)) {
        onChange(selectedCampusIds.filter(id => id !== campusId))
      } else {
        onChange([...selectedCampusIds, campusId])
      }
    } else {
      onChange([campusId])
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left h-auto min-h-10 py-2 px-3 rounded-lg !border !border-black dark:!border-white',
            !selectedCampuses.length && 'text-muted-foreground',
            className
          )}
        >
          <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
          {selectedCampuses.length > 0 ? (
            <CampusBadges
              campuses={selectedCampuses}
              size="sm"
              maxVisible={3}
            />
          ) : (
            placeholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-2 bg-white dark:bg-zinc-950 border" align="start">
        <div className="space-y-1">
          {/* "All campuses" option for single-select mode */}
          {!multiple && (
            <button
              type="button"
              onClick={() => {
                onChange([])
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left',
                selectedCampusIds.length === 0
                  ? 'bg-gray-100 dark:bg-zinc-800'
                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  selectedCampusIds.length === 0 ? 'bg-primary border-primary' : 'border-input'
                )}
              >
                {selectedCampusIds.length === 0 && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">
                All campuses
              </span>
            </button>
          )}
          {campuses.map((campus) => {
            const isSelected = selectedCampusIds.includes(campus.id)
            return (
              <button
                key={campus.id}
                type="button"
                onClick={() => handleToggle(campus.id)}
                className={cn(
                  'w-full flex items-center gap-2 p-2 rounded-md transition-colors text-left',
                  isSelected
                    ? 'bg-gray-100 dark:bg-zinc-800'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                    isSelected ? 'bg-primary border-primary' : 'border-input'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: campus.color }}
                />
                <span className="text-sm font-medium flex-1 truncate">
                  {campus.name}
                </span>
                {campus.is_default && (
                  <span className="text-xs text-muted-foreground">(Main)</span>
                )}
              </button>
            )
          })}
          {campuses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No campuses available
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})

// Single campus picker variant
interface SingleCampusPickerProps {
  campuses: CampusOption[]
  selectedCampusId: string | null
  onChange: (campusId: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const SingleCampusPicker = memo(function SingleCampusPicker({
  campuses,
  selectedCampusId,
  onChange,
  placeholder = 'Select campus...',
  disabled = false,
  className,
}: SingleCampusPickerProps) {
  const handleChange = (campusIds: string[]) => {
    onChange(campusIds[0] || null)
  }

  return (
    <CampusPicker
      campuses={campuses}
      selectedCampusIds={selectedCampusId ? [selectedCampusId] : []}
      onChange={handleChange}
      multiple={false}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  )
})
