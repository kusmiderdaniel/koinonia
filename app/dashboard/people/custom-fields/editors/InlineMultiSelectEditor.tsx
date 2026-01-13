'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { optionColors } from '@/lib/validations/forms'
import type { SelectOption } from '@/types/custom-fields'

// Get Tailwind classes for an option color
function getOptionColorClasses(colorName?: string | null) {
  const color = optionColors.find((c) => c.name === colorName)
  if (color) {
    return { bg: color.bg, text: color.text }
  }
  // Default gray
  return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-zinc-200' }
}

interface InlineMultiSelectEditorProps {
  value: string[]
  onChange: (value: string[]) => void
  options: SelectOption[]
  disabled?: boolean
  canEdit?: boolean
}

export function InlineMultiSelectEditor({
  value,
  onChange,
  options,
  disabled = false,
  canEdit = true,
}: InlineMultiSelectEditorProps) {
  const [open, setOpen] = useState(false)
  const selectedValues = Array.isArray(value) ? value : []
  const selectedOptions = selectedValues
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as SelectOption[]

  const handleToggle = (optionValue: string) => {
    const isSelected = selectedValues.includes(optionValue)
    if (isSelected) {
      onChange(selectedValues.filter((v) => v !== optionValue))
    } else {
      onChange([...selectedValues, optionValue])
    }
  }

  const renderValue = () => {
    if (selectedOptions.length === 0) {
      return <span className="text-muted-foreground/50">—</span>
    }
    return (
      <div className="flex flex-wrap gap-1">
        {selectedOptions.map((opt, index) => {
          const colorClasses = getOptionColorClasses(opt.color)
          return (
            <span
              key={`${opt.value}-${index}`}
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                colorClasses.bg,
                colorClasses.text
              )}
            >
              {opt.label}
            </span>
          )
        })}
      </div>
    )
  }

  if (!canEdit) {
    return renderValue()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'min-w-[60px] px-1 py-0.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 text-left',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {renderValue()}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg"
        align="start"
      >
        <div className="space-y-1">
          {options.map((option, index) => {
            const isSelected = selectedValues.includes(option.value)
            const colorClasses = getOptionColorClasses(option.color)
            return (
              <button
                key={`${option.value}-${index}`}
                onClick={() => handleToggle(option.value)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded border flex items-center justify-center flex-shrink-0',
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {isSelected && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    colorClasses.bg,
                    colorClasses.text
                  )}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No options available
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
