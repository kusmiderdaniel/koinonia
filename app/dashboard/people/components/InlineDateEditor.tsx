'use client'

import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDate } from './member-table-types'

interface InlineDateEditorProps {
  value: string | null
  onChange: (date: string | null) => void
  disabled?: boolean
  canEdit: boolean
  placeholder?: string
}

export function InlineDateEditor({
  value,
  onChange,
  disabled = false,
  canEdit,
  placeholder = '—',
}: InlineDateEditorProps) {
  if (!canEdit) {
    return (
      <span className="px-2 py-1 inline-block">
        {value ? formatDate(value) : placeholder}
      </span>
    )
  }

  if (value) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value || null)}
        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
        onKeyDown={(e) => e.preventDefault()}
        disabled={disabled}
        className="w-[130px] h-8 text-sm border-0 bg-transparent hover:bg-muted focus:bg-muted cursor-pointer rounded-md px-2"
      />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted px-2 py-1 rounded cursor-pointer">
          {placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-white dark:bg-zinc-950 border shadow-lg">
        <Input
          type="date"
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value)
            }
          }}
          disabled={disabled}
          className="w-[150px]"
        />
      </PopoverContent>
    </Popover>
  )
}
