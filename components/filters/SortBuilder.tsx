'use client'

import { useState, useCallback, memo, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ArrowUpDown,
  Plus,
  Trash2,
  X,
  GripVertical,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
} from 'lucide-react'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  type SortState,
  type SortRule,
  type SortDirection,
  type SortFieldDefinition,
  type SortFieldIcon,
  createSortRule,
  createEmptySortState,
  countActiveSorts,
} from '@/lib/filters/sort-types'

// Icon mapping for field types
const fieldIcons: Record<SortFieldIcon, ReactNode> = {
  text: <Type className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  boolean: <ToggleLeft className="h-3 w-3" />,
  select: <List className="h-3 w-3" />,
}

export interface SortBuilderProps {
  /** Current sort state */
  sortState: SortState
  /** Callback when sort state changes */
  onChange: (sortState: SortState) => void
  /** Field definitions for this sort */
  sortFields: SortFieldDefinition[]
}

export const SortBuilder = memo(function SortBuilder({
  sortState,
  onChange,
  sortFields,
}: SortBuilderProps) {
  const t = useTranslations('sort')
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const activeSortCount = countActiveSorts(sortState)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (over && active.id !== over.id) {
        const oldIndex = sortState.findIndex((s) => s.id === active.id)
        const newIndex = sortState.findIndex((s) => s.id === over.id)
        onChange(arrayMove(sortState, oldIndex, newIndex))
      }
    },
    [sortState, onChange]
  )

  const handleAddSort = useCallback(() => {
    onChange([...sortState, createSortRule(sortState, sortFields)])
  }, [sortState, onChange, sortFields])

  const handleUpdateSort = useCallback(
    (sortId: string, updates: Partial<SortRule>) => {
      onChange(sortState.map((sort) => (sort.id === sortId ? { ...sort, ...updates } : sort)))
    },
    [sortState, onChange]
  )

  const handleRemoveSort = useCallback(
    (sortId: string) => {
      onChange(sortState.filter((sort) => sort.id !== sortId))
    },
    [sortState, onChange]
  )

  const handleClearAll = useCallback(() => {
    onChange(createEmptySortState())
  }, [onChange])

  // Get fields that are not already used in sorts (except current)
  const getAvailableFields = (currentSortId: string) => {
    const usedFields = sortState.filter((s) => s.id !== currentSortId).map((s) => s.field)
    return sortFields.filter((f) => !usedFields.includes(f.id))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto justify-center !border !border-black dark:!border-zinc-700"
        >
          <ArrowUpDown className="h-4 w-4" />
          {activeSortCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                {t('sortCount', { count: activeSortCount })}
              </span>
            </span>
          ) : (
            t('title')
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90vw] max-w-[400px] p-0 bg-white dark:bg-zinc-950 border shadow-lg"
        align={isMobile ? 'center' : 'start'}
        sideOffset={8}
      >
        <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
          {/* Sort rules with drag and drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortState.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortState.map((sort) => (
                <SortRuleRow
                  key={sort.id}
                  sort={sort}
                  sortFields={sortFields}
                  availableFields={getAvailableFields(sort.id)}
                  onUpdate={(updates) => handleUpdateSort(sort.id, updates)}
                  onRemove={() => handleRemoveSort(sort.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Empty state */}
          {sortState.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('emptyState')}
            </p>
          )}

          {/* Add sort button */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1 !border !border-black dark:!border-white"
              onClick={handleAddSort}
              disabled={sortState.length >= sortFields.length}
            >
              <Plus className="h-4 w-4" />
              {t('addSort')}
            </Button>
          </div>

          {/* Clear all */}
          {activeSortCount > 0 && (
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
                {t('deleteSort')}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
})

// Sort Rule Row Component
interface SortRuleRowProps {
  sort: SortRule
  sortFields: SortFieldDefinition[]
  availableFields: SortFieldDefinition[]
  onUpdate: (updates: Partial<SortRule>) => void
  onRemove: () => void
}

const SortRuleRow = memo(function SortRuleRow({
  sort,
  sortFields,
  availableFields,
  onUpdate,
  onRemove,
}: SortRuleRowProps) {
  const t = useTranslations('sort')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sort.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const currentField = sortFields.find((f) => f.id === sort.field)
  const allFieldsForSelect = currentField
    ? [currentField, ...availableFields.filter((f) => f.id !== currentField.id)]
    : availableFields

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Field selector */}
      <Select value={sort.field} onValueChange={(v) => onUpdate({ field: v })}>
        <SelectTrigger className="flex-1 sm:w-[140px] h-8 text-xs">
          <SelectValue>
            <div className="flex items-center gap-2">
              {currentField && fieldIcons[currentField.icon]}
              {currentField?.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="border border-black dark:border-zinc-700">
          {allFieldsForSelect.map((f) => (
            <SelectItem
              key={f.id}
              value={f.id}
              className="hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                {fieldIcons[f.icon]}
                {f.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Direction selector */}
      <Select value={sort.direction} onValueChange={(v) => onUpdate({ direction: v as SortDirection })}>
        <SelectTrigger className="w-[90px] sm:w-[120px] h-8 text-xs flex-shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border border-black dark:border-zinc-700">
          <SelectItem value="asc" className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {t('ascending')}
          </SelectItem>
          <SelectItem value="desc" className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {t('descending')}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
})
