'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export interface EntityOption {
  id: string
  name: string
  color?: string | null
}

interface InlineEntityEditorProps<T extends EntityOption> {
  value: string | null
  entity: T | null | undefined
  options: T[]
  onUpdate: (id: string | null) => Promise<void>
  placeholder?: string
  emptyLabel?: string
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
}

export function InlineEntityEditor<T extends EntityOption>({
  value,
  entity,
  options,
  onUpdate,
  placeholder = '—',
  emptyLabel = 'None',
  disabled = false,
  align = 'start',
}: InlineEntityEditorProps<T>) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (newId: string | null) => {
    if (newId === value || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(newId)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <span className={isUpdating ? 'opacity-50' : ''}>
            {entity ? (
              <Badge
                variant="outline"
                className="rounded-full text-xs cursor-pointer"
                style={
                  entity.color
                    ? { borderColor: entity.color, color: entity.color }
                    : undefined
                }
              >
                {entity.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm px-2 py-0.5 hover:bg-muted rounded cursor-pointer">
                {placeholder}
              </span>
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="bg-white dark:bg-zinc-950 max-h-[300px] overflow-y-auto"
      >
        <DropdownMenuItem
          onClick={() => handleChange(null)}
          className="cursor-pointer"
        >
          <span className="text-muted-foreground">{emptyLabel}</span>
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => handleChange(option.id)}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {option.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: option.color }}
                />
              )}
              {option.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
