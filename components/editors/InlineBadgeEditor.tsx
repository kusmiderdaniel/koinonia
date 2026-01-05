'use client'

import { useState, type ReactNode } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface BadgeOption<T extends string> {
  value: T
  label: string
}

interface InlineBadgeEditorProps<T extends string> {
  value: T
  options: BadgeOption<T>[]
  onUpdate: (value: T) => Promise<void>
  renderBadge: (value: T, size?: 'sm' | 'default') => ReactNode
  disabled?: boolean
  align?: 'start' | 'center' | 'end'
}

export function InlineBadgeEditor<T extends string>({
  value,
  options,
  onUpdate,
  renderBadge,
  disabled = false,
  align = 'start',
}: InlineBadgeEditorProps<T>) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (newValue: T) => {
    if (newValue === value || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(newValue)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <span className={isUpdating ? 'opacity-50' : ''}>
            {renderBadge(value, 'sm')}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="bg-white dark:bg-zinc-950">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleChange(option.value)}
            className="cursor-pointer"
          >
            {renderBadge(option.value)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
