'use client'

import { Plus, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatrixCellProps {
  type: 'song' | 'agenda' | 'position'
  // Agenda/Song props
  title?: string | null
  songKey?: string | null
  isPlaceholder?: boolean
  leaderName?: string | null
  // Position props
  personName?: string | null
  status?: string | null
  // Common
  isEmpty?: boolean
  onClick?: () => void
}

export function MatrixCell({
  type,
  title,
  songKey,
  isPlaceholder,
  leaderName,
  personName,
  status,
  isEmpty,
  onClick,
}: MatrixCellProps) {
  // Empty cell
  if (isEmpty) {
    return (
      <button
        onClick={onClick}
        className="w-full h-full rounded-md border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center hover:border-gray-400 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>
    )
  }

  // Song cell (purple/amber)
  if (type === 'song') {
    // Placeholder without song selected (amber)
    if (isPlaceholder) {
      return (
        <button
          onClick={onClick}
          className="w-full h-full rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 text-left hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors border border-dashed border-amber-300 dark:border-amber-700"
        >
          <div className="text-xs font-medium truncate">Select song...</div>
        </button>
      )
    }

    // Filled song (purple)
    return (
      <button
        onClick={onClick}
        className="w-full h-full rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 text-left hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
      >
        <div className="text-xs font-medium truncate">{title}</div>
        {(songKey || leaderName) && (
          <div className="text-[10px] opacity-75 truncate flex items-center gap-1">
            {songKey && (
              <>
                <Music className="w-2.5 h-2.5 flex-shrink-0" />
                <span>{songKey}</span>
              </>
            )}
            {songKey && leaderName && <span>·</span>}
            {leaderName && <span className="truncate">{leaderName}</span>}
          </div>
        )}
      </button>
    )
  }

  // Agenda item cell (gray/blue)
  if (type === 'agenda') {
    // Need leader assignment
    if (!leaderName) {
      return (
        <button
          onClick={onClick}
          className="w-full h-full rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 px-2 py-1 text-left hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <div className="text-xs font-medium truncate">{title}</div>
          <div className="text-[10px] text-orange-600 dark:text-orange-400">Assign leader...</div>
        </button>
      )
    }

    // Has leader (blue)
    return (
      <button
        onClick={onClick}
        className="w-full h-full rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 text-left hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
      >
        <div className="text-xs font-medium truncate">{title}</div>
        <div className="text-[10px] opacity-75 truncate">{leaderName}</div>
      </button>
    )
  }

  // Position cell (green)
  if (type === 'position' && personName) {
    const statusColors = {
      accepted: 'bg-green-600',
      declined: 'bg-red-600',
      invited: 'bg-yellow-500',
      expired: 'bg-gray-400',
    }

    const statusColor = status ? statusColors[status as keyof typeof statusColors] : undefined

    return (
      <button
        onClick={onClick}
        className="w-full h-full rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 text-left hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate flex-1">{personName}</span>
          {statusColor && (
            <span
              className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', statusColor)}
              title={status || undefined}
            />
          )}
        </div>
      </button>
    )
  }

  return null
}
