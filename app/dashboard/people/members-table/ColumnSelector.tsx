'use client'

import { useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Columns3 } from 'lucide-react'
import {
  PEOPLE_COLUMNS,
  ALL_PEOPLE_COLUMN_KEYS,
  type PeopleColumnKey,
} from './columns'

interface ColumnSelectorProps {
  visibleColumns: PeopleColumnKey[] | null
  onChange: (columns: PeopleColumnKey[] | null) => void
}

export function ColumnSelector({ visibleColumns, onChange }: ColumnSelectorProps) {
  const t = useTranslations('people')
  const tColumns = useTranslations('people.columns')

  // Calculate how many columns are hidden
  const hiddenCount = visibleColumns
    ? ALL_PEOPLE_COLUMN_KEYS.length - visibleColumns.length
    : 0

  const handleToggleColumn = (columnKey: PeopleColumnKey) => {
    // If all columns are visible (null), start with all columns
    const currentVisible = visibleColumns || [...ALL_PEOPLE_COLUMN_KEYS]

    if (currentVisible.includes(columnKey)) {
      // Remove the column (but don't allow removing required columns like 'name')
      const column = PEOPLE_COLUMNS.find((c) => c.key === columnKey)
      if (column && !column.canHide) return

      const newVisible = currentVisible.filter((k) => k !== columnKey)
      // If all columns would be shown, set to null
      onChange(newVisible.length === ALL_PEOPLE_COLUMN_KEYS.length ? null : newVisible)
    } else {
      // Add the column
      const newVisible = [...currentVisible, columnKey]
      // If all columns would be shown, set to null
      onChange(newVisible.length === ALL_PEOPLE_COLUMN_KEYS.length ? null : newVisible)
    }
  }

  const handleShowAll = () => {
    onChange(null)
  }

  const isColumnVisible = (columnKey: PeopleColumnKey): boolean => {
    if (!visibleColumns) return true
    return visibleColumns.includes(columnKey)
  }

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
      <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-zinc-950 p-2">
        <div className="space-y-1">
          {/* Show All button */}
          {hiddenCount > 0 && (
            <button
              onClick={handleShowAll}
              className="w-full text-left text-sm text-brand hover:underline px-2 py-1.5"
            >
              {tColumns('showAll')}
            </button>
          )}

          {/* Column checkboxes */}
          {PEOPLE_COLUMNS.map((column) => (
            <label
              key={column.key}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={isColumnVisible(column.key)}
                onCheckedChange={() => handleToggleColumn(column.key)}
                disabled={!column.canHide}
              />
              <span className={`text-sm ${!column.canHide ? 'text-muted-foreground' : ''}`}>
                {t(column.labelKey)}
              </span>
            </label>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
