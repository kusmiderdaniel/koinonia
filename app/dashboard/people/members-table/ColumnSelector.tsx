'use client'

import { useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Columns3, GripVertical, RotateCcw, Snowflake } from 'lucide-react'
import {
  PEOPLE_COLUMNS,
  getAllColumns,
  isPinnedColumn,
  isColumnFrozen,
  type PeopleColumn,
  type PeopleColumnKey,
} from './columns'
import { cn } from '@/lib/utils'
import type { CustomFieldDefinition } from '@/types/custom-fields'

// Sortable column item component
function SortableColumnItem({
  column,
  isVisible,
  onToggle,
  onFreeze,
  isFrozen,
  t,
  tColumns,
}: {
  column: PeopleColumn
  isVisible: boolean
  onToggle: () => void
  onFreeze?: () => void
  isFrozen?: boolean
  t: ReturnType<typeof useTranslations>
  tColumns: ReturnType<typeof useTranslations>
}) {
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

interface ColumnSelectorProps {
  visibleColumns: PeopleColumnKey[] | null
  onChange: (columns: PeopleColumnKey[] | null) => void
  customFields: CustomFieldDefinition[]
  // New props for column ordering
  orderedColumns?: PeopleColumn[]
  onReorderColumns?: (activeKey: string, overKey: string) => void
  onResetToDefault?: () => void
  // Freeze props
  freezeColumnKey?: string | null
  onFreezeColumnChange?: (key: string | null) => void
}

export function ColumnSelector({
  visibleColumns,
  onChange,
  customFields,
  orderedColumns,
  onReorderColumns,
  onResetToDefault,
  freezeColumnKey,
  onFreezeColumnChange,
}: ColumnSelectorProps) {
  const t = useTranslations('people')
  const tColumns = useTranslations('people.columns')

  // Get all columns including custom fields
  const allColumns = useMemo(() => getAllColumns(customFields), [customFields])
  const allColumnKeys = useMemo(() => allColumns.map(c => c.key), [allColumns])

  // Use orderedColumns if provided, otherwise fall back to allColumns
  const columnsToDisplay = orderedColumns || allColumns

  // Calculate how many columns are hidden
  const hiddenCount = visibleColumns
    ? allColumnKeys.length - visibleColumns.length
    : 0

  // DnD sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && onReorderColumns) {
      onReorderColumns(active.id as string, over.id as string)
    }
  }, [onReorderColumns])

  const handleToggleColumn = (columnKey: PeopleColumnKey) => {
    // If all columns are visible (null), start with all columns
    const currentVisible = visibleColumns || [...allColumnKeys]

    if (currentVisible.includes(columnKey)) {
      // Remove the column (but don't allow removing required columns like 'name')
      const column = allColumns.find((c) => c.key === columnKey)
      if (column && !column.canHide) return

      const newVisible = currentVisible.filter((k) => k !== columnKey)
      // If all columns would be shown, set to null
      onChange(newVisible.length === allColumnKeys.length ? null : newVisible)
    } else {
      // Add the column
      const newVisible = [...currentVisible, columnKey]
      // If all columns would be shown, set to null
      onChange(newVisible.length === allColumnKeys.length ? null : newVisible)
    }
  }

  const handleShowAll = () => {
    onChange(null)
  }

  const isColumnVisible = (columnKey: PeopleColumnKey): boolean => {
    if (!visibleColumns) return true
    return visibleColumns.includes(columnKey)
  }

  // Handle freeze/unfreeze column
  const handleFreezeColumn = (columnKey: PeopleColumnKey) => {
    if (!onFreezeColumnChange) return

    // If clicking the currently frozen column, unfreeze all
    if (freezeColumnKey === columnKey) {
      onFreezeColumnChange(null)
    } else {
      // Freeze up to this column
      onFreezeColumnChange(columnKey)
    }
  }

  // Check if a column is frozen (up to and including freezeColumnKey)
  const checkIsFrozen = (columnKey: PeopleColumnKey): boolean => {
    return isColumnFrozen(columnKey, columnsToDisplay, freezeColumnKey ?? null)
  }

  // Separate static and custom columns from ordered columns
  const staticColumnsOrdered = columnsToDisplay.filter(c => !c.isCustomField)
  const customColumnsOrdered = columnsToDisplay.filter(c => c.isCustomField)

  // Get column keys for sortable context
  const staticColumnKeys = staticColumnsOrdered.map(c => c.key)
  const customColumnKeys = customColumnsOrdered.map(c => c.key)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 w-full sm:w-auto justify-center !border !border-black dark:!border-zinc-700 ${hiddenCount > 0 ? '!border-brand text-brand' : ''}`}
        >
          <Columns3 className="h-4 w-4" />
          {tColumns('title')}
          {hiddenCount > 0 && (
            <span className="ml-1 text-xs bg-brand text-brand-foreground rounded-full px-1.5 py-0.5">
              {hiddenCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-white dark:bg-zinc-950 p-2 max-h-96 overflow-y-auto">
        <div className="space-y-1">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-2">
            {hiddenCount > 0 && (
              <button
                onClick={handleShowAll}
                className="text-xs text-brand hover:underline"
              >
                {tColumns('showAll')}
              </button>
            )}
            {freezeColumnKey && onFreezeColumnChange && (
              <button
                onClick={() => onFreezeColumnChange(null)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Snowflake className="h-3 w-3" />
                {tColumns('unfreezeAll')}
              </button>
            )}
            {onResetToDefault && (
              <button
                onClick={onResetToDefault}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                {tColumns('reset')}
              </button>
            )}
          </div>

          {/* Drag-and-drop context for reordering */}
          {onReorderColumns ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {/* Static columns with DnD */}
              <SortableContext items={staticColumnKeys} strategy={verticalListSortingStrategy}>
                {staticColumnsOrdered.map((column) => (
                  <SortableColumnItem
                    key={column.key}
                    column={column}
                    isVisible={isColumnVisible(column.key)}
                    onToggle={() => handleToggleColumn(column.key)}
                    onFreeze={onFreezeColumnChange ? () => handleFreezeColumn(column.key) : undefined}
                    isFrozen={checkIsFrozen(column.key)}
                    t={t}
                    tColumns={tColumns}
                  />
                ))}
              </SortableContext>

              {/* Custom field columns */}
              {customColumnsOrdered.length > 0 && (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('customFields.title')}
                  </div>
                  <SortableContext items={customColumnKeys} strategy={verticalListSortingStrategy}>
                    {customColumnsOrdered.map((column) => (
                      <SortableColumnItem
                        key={column.key}
                        column={column}
                        isVisible={isColumnVisible(column.key)}
                        onToggle={() => handleToggleColumn(column.key)}
                        onFreeze={onFreezeColumnChange ? () => handleFreezeColumn(column.key) : undefined}
                        isFrozen={checkIsFrozen(column.key)}
                        t={t}
                        tColumns={tColumns}
                      />
                    ))}
                  </SortableContext>
                </>
              )}
            </DndContext>
          ) : (
            // Legacy mode without DnD
            <>
              {staticColumnsOrdered.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={isColumnVisible(column.key)}
                    onCheckedChange={() => handleToggleColumn(column.key)}
                    disabled={!column.canHide}
                  />
                  <span className={cn('text-sm', !column.canHide && 'text-muted-foreground')}>
                    {t(column.labelKey)}
                  </span>
                </label>
              ))}

              {customColumnsOrdered.length > 0 && (
                <>
                  <DropdownMenuSeparator className="my-2" />
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('customFields.title')}
                  </div>
                  {customColumnsOrdered.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={isColumnVisible(column.key)}
                        onCheckedChange={() => handleToggleColumn(column.key)}
                      />
                      <span className="text-sm">
                        {column.labelKey}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
