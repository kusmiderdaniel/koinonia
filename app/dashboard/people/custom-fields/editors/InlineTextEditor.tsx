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

interface InlineTextEditorProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  canEdit?: boolean
  placeholder?: string
}

export function InlineTextEditor({
  value,
  onChange,
  disabled = false,
  canEdit = true,
  placeholder = '',
}: InlineTextEditorProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')

  const handleSave = () => {
    onChange(inputValue.trim() || null)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setInputValue(value || '')
      setOpen(false)
    }
  }

  if (!canEdit) {
    return <span className="text-muted-foreground">{value || '—'}</span>
  }

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) {
          setInputValue(value || '')
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'text-sm text-left px-2 py-1 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-w-[60px]',
            !value && 'text-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {value || '—'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg p-3"
        align="start"
      >
        <div className="space-y-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
            className="!border !border-black dark:!border-white"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="!border !border-black dark:!border-white"
              onClick={() => {
                setInputValue(value || '')
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
