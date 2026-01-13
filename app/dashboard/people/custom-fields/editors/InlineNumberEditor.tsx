'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatNumberValue, type NumberSettings } from '@/types/custom-fields'

interface InlineNumberEditorProps {
  value: number | null
  onChange: (value: number | null) => void
  settings: NumberSettings
  disabled?: boolean
  canEdit?: boolean
}

export function InlineNumberEditor({
  value,
  onChange,
  settings,
  disabled = false,
  canEdit = true,
}: InlineNumberEditorProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value?.toString() || '')

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      onChange(null)
    } else {
      const num = parseFloat(trimmed)
      if (!isNaN(num)) {
        // Validate min/max if set
        if (settings.min !== undefined && num < settings.min) {
          onChange(settings.min)
        } else if (settings.max !== undefined && num > settings.max) {
          onChange(settings.max)
        } else {
          onChange(num)
        }
      }
    }
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setInputValue(value?.toString() || '')
      setOpen(false)
    }
  }

  if (!canEdit) {
    return (
      <span className="text-muted-foreground">
        {formatNumberValue(value, settings)}
      </span>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) {
          setInputValue(value?.toString() || '')
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'text-sm text-left px-2 py-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-w-[60px]',
            value === null && 'text-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {formatNumberValue(value, settings)}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg p-3"
        align="start"
      >
        <div className="space-y-2">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            min={settings.min}
            max={settings.max}
            step={settings.decimals ? Math.pow(10, -settings.decimals) : 1}
            autoFocus
            className="!border !border-black dark:!border-white"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="!border !border-black dark:!border-white"
              onClick={() => {
                setInputValue(value?.toString() || '')
                setOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={disabled}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
