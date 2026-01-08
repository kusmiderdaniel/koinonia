'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GripVertical, MoreVertical, Pencil, Trash2, Music, ChevronUp, ChevronDown } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatSecondsToMinutes } from '@/lib/utils/format'
import { useIsMobile } from '@/lib/hooks'

interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  is_song_placeholder: boolean
  ministry_id: string | null
  ministry: { id: string; name: string } | null
  sort_order: number
}

interface SortableTemplateAgendaItemProps {
  item: AgendaItem
  index: number
  totalItems: number
  canManage: boolean
  onEdit: (item: AgendaItem) => void
  onRemove: (itemId: string) => void
  onMoveUp?: (itemId: string) => void
  onMoveDown?: (itemId: string) => void
}

export const SortableTemplateAgendaItem = memo(function SortableTemplateAgendaItem({
  item,
  index,
  totalItems,
  canManage,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SortableTemplateAgendaItemProps) {
  const isMobile = useIsMobile()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const canMoveUp = index > 0
  const canMoveDown = index < totalItems - 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-zinc-950 transition-all hover:bg-gray-100 dark:hover:bg-zinc-900 select-none ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {canManage && (
        isMobile && onMoveUp && onMoveDown ? (
          <div className="flex flex-col -my-1 flex-shrink-0">
            <button
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => onMoveUp(item.id)}
              disabled={!canMoveUp}
              aria-label="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => onMoveDown(item.id)}
              disabled={!canMoveDown}
              aria-label="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            className="p-2 -m-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.is_song_placeholder && (
            <Music className="w-4 h-4 text-purple-500 flex-shrink-0" />
          )}
          <span className="font-medium truncate">{item.title}</span>
          <span className="text-xs text-muted-foreground">
            {formatSecondsToMinutes(item.duration_seconds)}
          </span>
        </div>
        {item.ministry && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.ministry.name}
          </div>
        )}
        {item.description && (
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.description}
          </div>
        )}
      </div>
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRemove(item.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
})
