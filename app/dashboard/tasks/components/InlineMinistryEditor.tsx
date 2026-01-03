'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { TaskMinistry } from '../types'

interface InlineMinistryEditorProps {
  ministryId: string | null
  ministry: TaskMinistry | null | undefined
  ministries: TaskMinistry[]
  onUpdate: (ministryId: string | null) => Promise<void>
  disabled?: boolean
}

export function InlineMinistryEditor({
  ministryId,
  ministry,
  ministries,
  onUpdate,
  disabled = false,
}: InlineMinistryEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleMinistryChange = async (newMinistryId: string | null) => {
    if (newMinistryId === ministryId || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(newMinistryId)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <span className={isUpdating ? 'opacity-50' : ''}>
            {ministry ? (
              <Badge
                variant="outline"
                className="rounded-full text-xs cursor-pointer"
                style={{
                  borderColor: ministry.color,
                  color: ministry.color,
                }}
              >
                {ministry.name}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm px-2 py-0.5 hover:bg-muted rounded cursor-pointer">
                —
              </span>
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white dark:bg-zinc-950 max-h-[300px] overflow-y-auto">
        <DropdownMenuItem
          onClick={() => handleMinistryChange(null)}
          className="cursor-pointer"
        >
          <span className="text-muted-foreground">No ministry</span>
        </DropdownMenuItem>
        {ministries.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => handleMinistryChange(m.id)}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              {m.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
