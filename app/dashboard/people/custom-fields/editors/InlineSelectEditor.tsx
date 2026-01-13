'use client'

import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface InlineSelectEditorProps {
  value: string | null
  onChange: (value: string | null) => void
  options: SelectOption[]
  disabled?: boolean
  canEdit?: boolean
}

export function InlineSelectEditor({
  value,
  onChange,
  options,
  disabled = false,
  canEdit = true,
}: InlineSelectEditorProps) {
  const selectedOption = options.find((o) => o.value === value)

  const renderValue = () => {
    if (!selectedOption) {
      return <span className="text-muted-foreground/50">—</span>
    }
    const colorClasses = getOptionColorClasses(selectedOption.color)
    return (
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          colorClasses.bg,
          colorClasses.text
        )}
      >
        {selectedOption.label}
      </span>
    )
  }

  if (!canEdit) {
    return renderValue()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'px-1 py-0.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {renderValue()}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="bg-white dark:bg-zinc-950 border border-black dark:border-white p-1"
      >
        {/* Clear option */}
        <DropdownMenuItem
          onClick={() => onChange(null)}
          className="cursor-pointer rounded text-sm text-muted-foreground"
        >
          Clear
        </DropdownMenuItem>
        {/* Option items */}
        {options.map((option, index) => {
          const colorClasses = getOptionColorClasses(option.color)
          return (
            <DropdownMenuItem
              key={`${option.value}-${index}`}
              onClick={() => onChange(option.value)}
              className={cn(
                'cursor-pointer rounded my-0.5',
                value === option.value && 'bg-muted'
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  colorClasses.bg,
                  colorClasses.text
                )}
              >
                {option.label}
              </span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
