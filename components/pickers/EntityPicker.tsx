'use client'

import { useState, useMemo, useCallback, ReactNode, memo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, X } from 'lucide-react'
import { SmartVirtualizedList } from '@/components/VirtualizedList'
import { cn } from '@/lib/utils'

// Generic entity type - must have an id
interface EntityBase {
  id: string
}

export interface EntityPickerProps<T extends EntityBase> {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Array of entities to display */
  items: T[]
  /** Currently selected entity ID (null for none) */
  selectedId: string | null
  /** Callback when an entity is selected */
  onSelect: (id: string | null) => void
  /** Dialog title */
  title: string
  /** Optional dialog description */
  description?: string
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Function to get searchable text from entity */
  getSearchableText: (item: T) => string
  /** Function to render each entity item */
  renderItem: (item: T, isSelected: boolean) => ReactNode
  /** Empty state message when no items */
  emptyMessage?: string
  /** Empty state message when no search results */
  noResultsMessage?: string
  /** Show clear/unassign option when something is selected */
  allowClear?: boolean
  /** Label for clear action */
  clearLabel?: string
  /** Enable virtualization for large lists (default: 50 items) */
  virtualizationThreshold?: number
  /** Estimated item height for virtualization */
  estimatedItemSize?: number
  /** Additional content to render below items (e.g., create new button) */
  footerContent?: ReactNode
  /** Custom class name for dialog content */
  className?: string
}

function EntityPickerInner<T extends EntityBase>({
  open,
  onOpenChange,
  items,
  selectedId,
  onSelect,
  title,
  description,
  searchPlaceholder = 'Search...',
  getSearchableText,
  renderItem,
  emptyMessage = 'No items found',
  noResultsMessage = 'No items match your search',
  allowClear = false,
  clearLabel = 'Clear selection',
  virtualizationThreshold = 50,
  estimatedItemSize = 56,
  footerContent,
  className,
}: EntityPickerProps<T>) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filteredItems = useMemo(() => {
    if (!debouncedSearch.trim()) return items

    const searchLower = debouncedSearch.toLowerCase()
    return items.filter((item) =>
      getSearchableText(item).toLowerCase().includes(searchLower)
    )
  }, [items, debouncedSearch, getSearchableText])

  const handleSelect = useCallback(
    (id: string | null) => {
      onSelect(id)
      onOpenChange(false)
      setSearch('')
    },
    [onSelect, onOpenChange]
  )

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setSearch('')
      }
      onOpenChange(isOpen)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('sm:max-w-md bg-white dark:bg-zinc-950', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Clear option */}
        {allowClear && selectedId && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full text-left p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <X className="h-4 w-4" />
              <span>{clearLabel}</span>
            </div>
          </button>
        )}

        {/* Item List */}
        <SmartVirtualizedList
          items={filteredItems}
          estimateSize={estimatedItemSize}
          className="max-h-[350px] -mx-4 px-4"
          virtualizationThreshold={virtualizationThreshold}
          emptyMessage={
            <p className="text-sm text-muted-foreground text-center py-4">
              {items.length === 0 ? emptyMessage : noResultsMessage}
            </p>
          }
          renderItem={(item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-all',
                item.id === selectedId
                  ? 'bg-brand/10 border-brand'
                  : 'border-black dark:border-white hover:bg-gray-50 dark:hover:bg-zinc-900'
              )}
            >
              {renderItem(item, item.id === selectedId)}
            </button>
          )}
        />

        {/* Footer content (e.g., create new button) */}
        {footerContent}

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Memoized wrapper component
export const EntityPicker = memo(EntityPickerInner) as typeof EntityPickerInner
