'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { TaskCampus } from '../types'

interface InlineCampusEditorProps {
  campusId: string | null
  campus: TaskCampus | null | undefined
  campuses: TaskCampus[]
  onUpdate: (campusId: string | null) => Promise<void>
  disabled?: boolean
}

export function InlineCampusEditor({
  campusId,
  campus,
  campuses,
  onUpdate,
  disabled = false,
}: InlineCampusEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCampusChange = async (newCampusId: string | null) => {
    if (newCampusId === campusId || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdate(newCampusId)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || isUpdating}>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <span className={isUpdating ? 'opacity-50' : ''}>
            {campus ? (
              <Badge
                variant="outline"
                className="rounded-full text-xs cursor-pointer"
                style={
                  campus.color
                    ? { borderColor: campus.color, color: campus.color }
                    : undefined
                }
              >
                {campus.name}
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
          onClick={() => handleCampusChange(null)}
          className="cursor-pointer"
        >
          <span className="text-muted-foreground">No campus</span>
        </DropdownMenuItem>
        {campuses.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => handleCampusChange(c.id)}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {c.color && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
              )}
              {c.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
