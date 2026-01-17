'use client'

import { memo, type CSSProperties } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { type Member, type AssignableRole } from './member-table-types'
import {
  isColumnVisible,
  getColumnKeyForField,
  isColumnFrozen,
  isLastFrozenColumn,
  getColumnMinWidth,
  type PeopleColumn,
  type PeopleColumnKey,
} from '../members-table/columns'
import { CustomFieldCell } from '../custom-fields/CustomFieldCell'
import type { CustomFieldDefinition, CustomFieldValueType } from '@/types/custom-fields'

// Import cell components
import {
  ActiveCell,
  NameCell,
  EmailCell,
  PhoneCell,
  RoleCell,
  CampusCell,
  MinistryRolesCell,
  GenderCell,
  DateOfBirthCell,
  AgeCell,
  BaptizedCell,
  BaptismDateCell,
  DepartureDateCell,
  DepartureReasonCell,
  JoinedCell,
  UserTypeCell,
} from './cells'

interface AvailableCampus {
  id: string
  name: string
  color: string
  is_default: boolean
}

interface MemberRowProps {
  member: Member
  index: number
  currentUserId: string
  visibleColumns: PeopleColumnKey[] | null
  customFields: CustomFieldDefinition[]
  canEditRole: boolean
  canEditActiveStatus: boolean
  canEditDeparture: boolean
  canEditFields: boolean
  canDeleteOffline: boolean
  isUpdatingRole: boolean
  isUpdatingActive: boolean
  isUpdatingDeparture: boolean
  isUpdatingBaptism: boolean
  isUpdatingCampuses: boolean
  isUpdatingProfile: boolean
  updatingCustomFieldKey: string | null
  allCampuses: AvailableCampus[]
  onRoleChange: (memberId: string, newRole: AssignableRole) => void
  onActiveChange: (memberId: string, active: boolean) => void
  onDepartureChange: (memberId: string, date: string | null, reason: string | null) => void
  onBaptismChange: (memberId: string, baptism: boolean, date: string | null) => void
  onCampusesChange: (memberId: string, campusIds: string[]) => void
  onProfileChange: (
    memberId: string,
    data: { sex?: string | null; dateOfBirth?: string | null; phone?: string | null; email?: string | null }
  ) => void
  onCustomFieldChange: (memberId: string, fieldId: string, value: CustomFieldValueType) => void
  onDeleteOffline: (member: Member) => void
  orderedColumns?: PeopleColumn[]
  columnWidths?: Record<string, number>
  freezeColumnKey?: string | null
  frozenColumnOffsets?: Record<string, number>
}

export const MemberRow = memo(function MemberRow({
  member,
  index,
  currentUserId,
  visibleColumns,
  customFields,
  canEditRole,
  canEditActiveStatus,
  canEditDeparture,
  canEditFields,
  canDeleteOffline,
  isUpdatingRole,
  isUpdatingActive,
  isUpdatingDeparture,
  isUpdatingBaptism,
  isUpdatingCampuses,
  isUpdatingProfile,
  updatingCustomFieldKey,
  allCampuses,
  onRoleChange,
  onActiveChange,
  onDepartureChange,
  onBaptismChange,
  onCampusesChange,
  onProfileChange,
  onCustomFieldChange,
  onDeleteOffline,
  orderedColumns,
  columnWidths = {},
  freezeColumnKey,
  frozenColumnOffsets = {},
}: MemberRowProps) {
  const show = (key: PeopleColumnKey) => isColumnVisible(key, visibleColumns)
  const canEditOfflineProfile = canEditFields && member.member_type === 'offline'

  // Helper to get column style including width and frozen position
  const getColumnStyle = (key: PeopleColumnKey): CSSProperties => {
    const width = columnWidths[key]
    const isFrozen = isColumnFrozen(key, orderedColumns || [], freezeColumnKey ?? null)
    const leftOffset = frozenColumnOffsets[key] ?? 0

    const style: CSSProperties = {}

    if (isFrozen) {
      const frozenWidth = width || getColumnMinWidth(key)
      style.width = `${frozenWidth}px`
      style.minWidth = `${frozenWidth}px`
      style.maxWidth = `${frozenWidth}px`
      style.position = 'sticky'
      style.left = `${leftOffset}px`
      style.zIndex = 10
    } else if (width) {
      style.width = `${width}px`
      style.minWidth = `${width}px`
      style.maxWidth = `${width}px`
    }

    return style
  }

  // Helper to get frozen cell classes
  const getFrozenClasses = (key: PeopleColumnKey): string => {
    const isFrozen = isColumnFrozen(key, orderedColumns || [], freezeColumnKey ?? null)
    const isLast = isLastFrozenColumn(key, freezeColumnKey ?? null)
    const isEvenRow = index % 2 === 0
    return cn(
      isFrozen && (isEvenRow ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-950'),
      isLast && 'shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]'
    )
  }

  // Render a cell based on column key
  const renderCell = (columnKey: PeopleColumnKey): React.ReactNode => {
    // Handle custom fields
    if (columnKey.startsWith('cf_')) {
      const fieldId = columnKey.replace('cf_', '')
      const field = customFields.find((f) => f.id === fieldId)
      if (!field) return null
      const value = member.custom_field_values?.[field.id]
      const isUpdating = updatingCustomFieldKey === `${member.id}:${field.id}`
      const shouldCenter = field.field_type === 'checkbox' || field.field_type === 'date'
      return (
        <TableCell
          key={columnKey}
          className={cn('text-muted-foreground', getFrozenClasses(columnKey))}
          style={getColumnStyle(columnKey)}
        >
          {shouldCenter ? (
            <div className="flex justify-center">
              <CustomFieldCell
                field={field}
                value={value}
                memberId={member.id}
                canEdit={canEditFields}
                isUpdating={isUpdating}
                onValueChange={(fId, newValue) => onCustomFieldChange(member.id, fId, newValue)}
              />
            </div>
          ) : (
            <CustomFieldCell
              field={field}
              value={value}
              memberId={member.id}
              canEdit={canEditFields}
              isUpdating={isUpdating}
              onValueChange={(fId, newValue) => onCustomFieldChange(member.id, fId, newValue)}
            />
          )}
        </TableCell>
      )
    }

    // Common props for all cells
    const baseProps = {
      member,
      columnKey,
      getColumnStyle,
      getFrozenClasses,
    }

    // Standard columns
    switch (columnKey) {
      case 'active':
        return (
          <ActiveCell
            key={columnKey}
            {...baseProps}
            canEditActiveStatus={canEditActiveStatus}
            isUpdatingActive={isUpdatingActive}
            onActiveChange={onActiveChange}
          />
        )

      case 'name':
        return (
          <NameCell
            key={columnKey}
            {...baseProps}
            currentUserId={currentUserId}
            canDeleteOffline={canDeleteOffline}
            onDeleteOffline={onDeleteOffline}
          />
        )

      case 'user_type':
        return <UserTypeCell key={columnKey} {...baseProps} />

      case 'email':
        return (
          <EmailCell
            key={columnKey}
            {...baseProps}
            canEditOfflineProfile={canEditOfflineProfile}
            isUpdatingProfile={isUpdatingProfile}
            onProfileChange={onProfileChange}
          />
        )

      case 'phone':
        return (
          <PhoneCell
            key={columnKey}
            {...baseProps}
            canEditOfflineProfile={canEditOfflineProfile}
            isUpdatingProfile={isUpdatingProfile}
            onProfileChange={onProfileChange}
          />
        )

      case 'role':
        return (
          <RoleCell
            key={columnKey}
            {...baseProps}
            canEditRole={canEditRole}
            isUpdatingRole={isUpdatingRole}
            onRoleChange={onRoleChange}
          />
        )

      case 'campus':
        return (
          <CampusCell
            key={columnKey}
            {...baseProps}
            canEditFields={canEditFields}
            isUpdatingCampuses={isUpdatingCampuses}
            allCampuses={allCampuses}
            onCampusesChange={onCampusesChange}
          />
        )

      case 'ministry_roles':
        return <MinistryRolesCell key={columnKey} {...baseProps} />

      case 'gender':
        return (
          <GenderCell
            key={columnKey}
            {...baseProps}
            canEditOfflineProfile={canEditOfflineProfile}
            isUpdatingProfile={isUpdatingProfile}
            onProfileChange={onProfileChange}
          />
        )

      case 'date_of_birth':
        return (
          <DateOfBirthCell
            key={columnKey}
            {...baseProps}
            canEditOfflineProfile={canEditOfflineProfile}
            isUpdatingProfile={isUpdatingProfile}
            onProfileChange={onProfileChange}
          />
        )

      case 'age':
        return <AgeCell key={columnKey} {...baseProps} />

      case 'baptized':
        return (
          <BaptizedCell
            key={columnKey}
            {...baseProps}
            canEditFields={canEditFields}
            isUpdatingBaptism={isUpdatingBaptism}
            onBaptismChange={onBaptismChange}
          />
        )

      case 'baptism_date':
        return (
          <BaptismDateCell
            key={columnKey}
            {...baseProps}
            canEditFields={canEditFields}
            isUpdatingBaptism={isUpdatingBaptism}
            onBaptismChange={onBaptismChange}
          />
        )

      case 'departure_date':
        return (
          <DepartureDateCell
            key={columnKey}
            {...baseProps}
            canEditDeparture={canEditDeparture}
            isUpdatingDeparture={isUpdatingDeparture}
            onDepartureChange={onDepartureChange}
          />
        )

      case 'departure_reason':
        return (
          <DepartureReasonCell
            key={columnKey}
            {...baseProps}
            canEditDeparture={canEditDeparture}
            isUpdatingDeparture={isUpdatingDeparture}
            onDepartureChange={onDepartureChange}
          />
        )

      case 'joined':
        return <JoinedCell key={columnKey} {...baseProps} />

      default:
        return null
    }
  }

  // If orderedColumns is provided, render cells in that order
  if (orderedColumns) {
    return (
      <TableRow
        className={cn(
          index % 2 === 0 && 'bg-zinc-100 dark:bg-zinc-800',
          !member.active && 'opacity-50'
        )}
      >
        {orderedColumns.map((column) => {
          if (!show(column.key)) return null
          return renderCell(column.key)
        })}
      </TableRow>
    )
  }

  // Legacy fallback: hardcoded column order
  const legacyColumnOrder: PeopleColumnKey[] = [
    'active',
    'name',
    'user_type',
    'email',
    'phone',
    'role',
    'campus',
    'ministry_roles',
    'gender',
    'date_of_birth',
    'age',
    'baptized',
    'baptism_date',
    'departure_date',
    'departure_reason',
    'joined',
    ...customFields.map((f) => getColumnKeyForField(f.id)),
  ]

  return (
    <TableRow
      className={cn(
        index % 2 === 0 && 'bg-zinc-100 dark:bg-zinc-800',
        !member.active && 'opacity-50'
      )}
    >
      {legacyColumnOrder.map((columnKey) => {
        if (!show(columnKey)) return null
        return renderCell(columnKey)
      })}
    </TableRow>
  )
})
