'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, Snowflake } from 'lucide-react'
import { isPinnedColumn, type PeopleColumn } from './columns'
import { cn } from '@/lib/utils'

interface SortableColumnItemProps {
  column: PeopleColumn
  isVisible: boolean
  onToggle: () => void
  onFreeze?: () => void
  isFrozen?: boolean
  t: ReturnType<typeof useTranslations>
  tColumns: ReturnType<typeof useTranslations>
}

export function SortableColumnItem({
  column,
  isVisible,
  onToggle,
  onFreeze,
  isFrozen,
  t,
  tColumns,
}: SortableColumnItemProps) {
  const isPinned = isPinnedColumn(column.key)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.key,
    disabled: isPinned,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
  }

  const label = column.isCustomField ? column.labelKey : t(column.labelKey)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted group',
        isDragging && 'bg-muted',
        isFrozen && 'bg-blue-50 dark:bg-blue-950/30'
      )}
    >
      {/* Drag handle - only for non-pinned columns */}
      {!isPinned ? (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      ) : (
        <div className="w-4" /> // Placeholder for alignment
      )}
      <label className="flex items-center gap-2 flex-1 cursor-pointer">
        <Checkbox
          checked={isVisible}
          onCheckedChange={onToggle}
          disabled={!column.canHide}
        />
        <span className={cn('text-sm', !column.canHide && 'text-muted-foreground')}>
          {label}
        </span>
        {isFrozen && (
          <Snowflake className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
        )}
      </label>
      {/* Freeze button - only for visible columns */}
      {isVisible && onFreeze && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onFreeze()
          }}
          className={cn(
            'text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
            isFrozen
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground'
          )}
          title={isFrozen ? tColumns('unfreezeHere') : tColumns('freezeUpToHere')}
        >
          <Snowflake className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
