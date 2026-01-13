'use client'

import { useTranslations } from 'next-intl'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { SortableColumnHeader } from './SortableColumnHeader'
import { ResizableTableHead } from './ResizableTableHead'
import {
  isColumnVisible,
  isColumnFrozen,
  isLastFrozenColumn,
  type PeopleColumn,
  type PeopleColumnKey,
} from './columns'
import type { CustomFieldDefinition } from '@/types/custom-fields'

function HeaderWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

// Column-specific tooltips
const COLUMN_TOOLTIPS: Partial<Record<PeopleColumnKey, string>> = {
  email: 'tableHeader.emailTooltip',
  gender: 'tableHeader.genderTooltip',
  date_of_birth: 'tableHeader.dateOfBirthTooltip',
}

// Get the header label for a column
function getColumnLabel(column: PeopleColumn, t: ReturnType<typeof useTranslations>): string {
  if (column.isCustomField) {
    return column.labelKey // Custom fields use direct name
  }
  return t(column.labelKey as Parameters<typeof t>[0])
}

interface MembersTableHeaderProps {
  visibleColumns: PeopleColumnKey[] | null
  customFields: CustomFieldDefinition[]
  orderedColumns?: PeopleColumn[]
  columnWidths?: Record<string, number>
  onResizeColumn?: (key: string, width: number) => void
  // Freeze props
  freezeColumnKey?: string | null
  frozenColumnOffsets?: Record<string, number>
}

export function MembersTableHeader({
  visibleColumns,
  customFields,
  orderedColumns,
  columnWidths = {},
  onResizeColumn,
  freezeColumnKey,
  frozenColumnOffsets = {},
}: MembersTableHeaderProps) {
  const t = useTranslations('people')

  const show = (key: PeopleColumnKey) => isColumnVisible(key, visibleColumns)

  // If orderedColumns is provided, use dynamic rendering with SortableContext
  // Note: DndContext should wrap the entire Table in the parent component
  if (orderedColumns) {
    // Get visible column keys for sortable context
    const visibleColumnKeys = orderedColumns
      .filter((col) => show(col.key))
      .map((col) => col.key)

    return (
      <TableHeader>
        <SortableContext
          items={visibleColumnKeys}
          strategy={horizontalListSortingStrategy}
        >
          <TableRow>
            {orderedColumns.map((column) => {
              if (!show(column.key)) return null

              const tooltipKey = COLUMN_TOOLTIPS[column.key]
              const label = getColumnLabel(column, t)
              const tooltip = tooltipKey ? t(tooltipKey as Parameters<typeof t>[0]) : undefined
              const description = column.fieldDefinition?.description

              const isFrozen = isColumnFrozen(column.key, orderedColumns, freezeColumnKey ?? null)
              const isLastFrozen = isLastFrozenColumn(column.key, freezeColumnKey ?? null)
              const leftOffset = frozenColumnOffsets[column.key] ?? 0

              return (
                <SortableColumnHeader
                  key={column.key}
                  columnKey={column.key}
                  width={columnWidths[column.key]}
                  onResize={onResizeColumn}
                  isFrozen={isFrozen}
                  leftOffset={leftOffset}
                  isLastFrozen={isLastFrozen}
                >
                  {tooltip || description ? (
                    <HeaderWithTooltip label={label} tooltip={tooltip || description!} />
                  ) : (
                    label
                  )}
                </SortableColumnHeader>
              )
            })}
          </TableRow>
        </SortableContext>
      </TableHeader>
    )
  }

  // Legacy fallback with hardcoded column order (no DnD)
  return (
    <TableHeader>
      <TableRow>
        {show('active') && (
          <ResizableTableHead columnKey="active" width={columnWidths['active']} onResize={onResizeColumn}>
            {t('tableHeader.active')}
          </ResizableTableHead>
        )}
        {show('name') && (
          <ResizableTableHead columnKey="name" width={columnWidths['name']} onResize={onResizeColumn}>
            {t('tableHeader.name')}
          </ResizableTableHead>
        )}
        {show('email') && (
          <ResizableTableHead columnKey="email" width={columnWidths['email']} onResize={onResizeColumn}>
            <HeaderWithTooltip label={t('tableHeader.email')} tooltip={t('tableHeader.emailTooltip')} />
          </ResizableTableHead>
        )}
        {show('phone') && (
          <ResizableTableHead columnKey="phone" width={columnWidths['phone']} onResize={onResizeColumn}>
            {t('tableHeader.phone')}
          </ResizableTableHead>
        )}
        {show('role') && (
          <ResizableTableHead columnKey="role" width={columnWidths['role']} onResize={onResizeColumn}>
            {t('tableHeader.role')}
          </ResizableTableHead>
        )}
        {show('campus') && (
          <ResizableTableHead columnKey="campus" width={columnWidths['campus']} onResize={onResizeColumn}>
            {t('tableHeader.campus')}
          </ResizableTableHead>
        )}
        {show('ministry_roles') && (
          <ResizableTableHead columnKey="ministry_roles" width={columnWidths['ministry_roles']} onResize={onResizeColumn}>
            {t('tableHeader.ministryRoles')}
          </ResizableTableHead>
        )}
        {show('gender') && (
          <ResizableTableHead columnKey="gender" width={columnWidths['gender']} onResize={onResizeColumn}>
            <HeaderWithTooltip label={t('tableHeader.gender')} tooltip={t('tableHeader.genderTooltip')} />
          </ResizableTableHead>
        )}
        {show('date_of_birth') && (
          <ResizableTableHead columnKey="date_of_birth" width={columnWidths['date_of_birth']} onResize={onResizeColumn}>
            <HeaderWithTooltip label={t('tableHeader.dateOfBirth')} tooltip={t('tableHeader.dateOfBirthTooltip')} />
          </ResizableTableHead>
        )}
        {show('age') && (
          <ResizableTableHead columnKey="age" width={columnWidths['age']} onResize={onResizeColumn}>
            {t('tableHeader.age')}
          </ResizableTableHead>
        )}
        {show('baptized') && (
          <ResizableTableHead columnKey="baptized" width={columnWidths['baptized']} onResize={onResizeColumn}>
            {t('tableHeader.baptized')}
          </ResizableTableHead>
        )}
        {show('baptism_date') && (
          <ResizableTableHead columnKey="baptism_date" width={columnWidths['baptism_date']} onResize={onResizeColumn}>
            {t('tableHeader.baptismDate')}
          </ResizableTableHead>
        )}
        {show('departure_date') && (
          <ResizableTableHead columnKey="departure_date" width={columnWidths['departure_date']} onResize={onResizeColumn}>
            {t('tableHeader.departureDate')}
          </ResizableTableHead>
        )}
        {show('departure_reason') && (
          <ResizableTableHead columnKey="departure_reason" width={columnWidths['departure_reason']} onResize={onResizeColumn}>
            {t('tableHeader.departureReason')}
          </ResizableTableHead>
        )}
        {show('joined') && (
          <ResizableTableHead columnKey="joined" width={columnWidths['joined']} onResize={onResizeColumn}>
            {t('tableHeader.joined')}
          </ResizableTableHead>
        )}
        {/* Custom field columns */}
        {customFields.map((field) => {
          const columnKey = `cf_${field.id}` as PeopleColumnKey
          if (!show(columnKey)) return null
          return (
            <ResizableTableHead
              key={field.id}
              columnKey={columnKey}
              width={columnWidths[columnKey]}
              onResize={onResizeColumn}
            >
              {field.description ? (
                <HeaderWithTooltip label={field.name} tooltip={field.description} />
              ) : (
                field.name
              )}
            </ResizableTableHead>
          )
        })}
      </TableRow>
    </TableHeader>
  )
}
