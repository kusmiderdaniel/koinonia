'use client'

import { useState, useCallback } from 'react'
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
import { ArrowUpDown, Plus, Trash2, X, GripVertical, Type, Hash, Calendar, ToggleLeft, List } from 'lucide-react'
import {
  SortState,
  SortRule,
  SortDirection,
  SORT_FIELDS,
  createSortRule,
  createEmptySortState,
} from './sort-types'
import { countActiveSorts } from './sort-logic'

interface SortBuilderProps {
  sortState: SortState
  onChange: (sortState: SortState) => void
}

// Icon mapping for field types
const fieldIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-3 w-3" />,
  number: <Hash className="h-3 w-3" />,
  date: <Calendar className="h-3 w-3" />,
  boolean: <ToggleLeft className="h-3 w-3" />,
  select: <List className="h-3 w-3" />,
}

export function SortBuilder({ sortState, onChange }: SortBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const activeSortCount = countActiveSorts(sortState)

  const handleAddSort = useCallback(() => {
    onChange([...sortState, createSortRule(sortState)])
  }, [sortState, onChange])

  const handleUpdateSort = useCallback((sortId: string, updates: Partial<SortRule>) => {
    onChange(
      sortState.map(sort =>
        sort.id === sortId ? { ...sort, ...updates } : sort
      )
    )
  }, [sortState, onChange])

  const handleRemoveSort = useCallback((sortId: string) => {
    onChange(sortState.filter(sort => sort.id !== sortId))
  }, [sortState, onChange])

  const handleClearAll = useCallback(() => {
    onChange(createEmptySortState())
  }, [onChange])

  // Get fields that are not already used in sorts (except current)
  const getAvailableFields = (currentSortId: string) => {
    const usedFields = sortState
      .filter(s => s.id !== currentSortId)
      .map(s => s.field)
    return SORT_FIELDS.filter(f => !usedFields.includes(f.id))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-center">
          <ArrowUpDown className="h-4 w-4" />
          {activeSortCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                {activeSortCount} sort{activeSortCount !== 1 ? 's' : ''}
              </span>
            </span>
          ) : (
            'Sort'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90vw] max-w-[400px] p-0 bg-white dark:bg-zinc-950 border shadow-lg"
        align={isMobile ? "center" : "start"}
        sideOffset={8}
      >
        <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
          {/* Sort rules */}
          {sortState.map((sort, index) => (
            <SortRuleRow
              key={sort.id}
              sort={sort}
              availableFields={getAvailableFields(sort.id)}
              onUpdate={(updates) => handleUpdateSort(sort.id, updates)}
              onRemove={() => handleRemoveSort(sort.id)}
            />
          ))}

          {/* Empty state */}
          {sortState.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sorts applied. Add a sort to order your data.
            </p>
          )}

          {/* Add sort button */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1"
              onClick={handleAddSort}
              disabled={sortState.length >= SORT_FIELDS.length}
            >
              <Plus className="h-4 w-4" />
              Add sort
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
                Delete sort
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Sort Rule Row Component
interface SortRuleRowProps {
  sort: SortRule
  availableFields: typeof SORT_FIELDS
  onUpdate: (updates: Partial<SortRule>) => void
  onRemove: () => void
}

function SortRuleRow({ sort, availableFields, onUpdate, onRemove }: SortRuleRowProps) {
  const currentField = SORT_FIELDS.find(f => f.id === sort.field)
  const allFieldsForSelect = currentField
    ? [currentField, ...availableFields.filter(f => f.id !== currentField.id)]
    : availableFields

  return (
    <div className="flex items-center gap-2">
      {/* Drag handle */}
      <div className="text-muted-foreground cursor-grab flex-shrink-0">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Field selector */}
      <Select value={sort.field} onValueChange={(v) => onUpdate({ field: v })}>
        <SelectTrigger className="flex-1 sm:w-[140px] h-8 text-xs">
          <div className="flex items-center gap-2">
            {currentField && fieldIcons[currentField.icon]}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {allFieldsForSelect.map(f => (
            <SelectItem key={f.id} value={f.id}>
              <div className="flex items-center gap-2">
                {fieldIcons[f.icon]}
                {f.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Direction selector */}
      <Select
        value={sort.direction}
        onValueChange={(v) => onUpdate({ direction: v as SortDirection })}
      >
        <SelectTrigger className="w-[90px] sm:w-[120px] h-8 text-xs flex-shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
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
}
