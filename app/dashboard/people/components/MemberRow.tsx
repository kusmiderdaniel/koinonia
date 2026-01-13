'use client'

import { useState, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CampusBadge, CampusBadges } from '@/components/CampusBadge'
import { cn } from '@/lib/utils'
import { InlineDateEditor } from './InlineDateEditor'
import {
  type Member,
  type AssignableRole,
  type Role,
  roleColors,
  assignableRoles,
  getRoleBadgeClasses,
  formatDate,
  formatDateOfBirth,
  calculateAge,
} from './member-table-types'
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
  onProfileChange: (memberId: string, data: { sex?: string | null; dateOfBirth?: string | null; phone?: string | null; email?: string | null }) => void
  onCustomFieldChange: (memberId: string, fieldId: string, value: CustomFieldValueType) => void
  onDeleteOffline: (member: Member) => void
  // New props for dynamic column ordering and widths
  orderedColumns?: PeopleColumn[]
  columnWidths?: Record<string, number>
  // Freeze props
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
  // Helper to check column visibility
  const show = (key: PeopleColumnKey) => isColumnVisible(key, visibleColumns)
  const t = useTranslations('people')

  // Helper to get column style including width and frozen position
  const getColumnStyle = (key: PeopleColumnKey): React.CSSProperties => {
    const width = columnWidths[key]
    const isFrozen = isColumnFrozen(key, orderedColumns || [], freezeColumnKey ?? null)
    const leftOffset = frozenColumnOffsets[key] ?? 0

    const style: React.CSSProperties = {}

    if (isFrozen) {
      // Frozen columns need explicit width to prevent collapse during horizontal scroll
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

  // Helper to get frozen cell classes - uses solid background colors matching row alternation
  const getFrozenClasses = (key: PeopleColumnKey): string => {
    const isFrozen = isColumnFrozen(key, orderedColumns || [], freezeColumnKey ?? null)
    const isLast = isLastFrozenColumn(key, freezeColumnKey ?? null)
    const isEvenRow = index % 2 === 0
    return cn(
      // Use solid background colors to hide scrolling content behind frozen cells
      isFrozen && (isEvenRow ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-950'),
      isLast && 'shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]'
    )
  }
  const [departurePopoverOpen, setDeparturePopoverOpen] = useState(false)
  const [campusPopoverOpen, setCampusPopoverOpen] = useState(false)
  const [phonePopoverOpen, setPhonePopoverOpen] = useState(false)
  const [phoneValue, setPhoneValue] = useState(member.phone || '')
  const [emailPopoverOpen, setEmailPopoverOpen] = useState(false)
  const [emailValue, setEmailValue] = useState(member.email || '')

  // Can edit profile fields only for offline members
  const canEditOfflineProfile = canEditFields && member.member_type === 'offline'

  // Get current campus IDs
  const currentCampusIds = member.campuses.map(c => c.id)

  // Handle toggling a campus
  const handleCampusToggle = (campusId: string) => {
    const isSelected = currentCampusIds.includes(campusId)
    let newCampusIds: string[]

    if (isSelected) {
      // Remove the campus
      newCampusIds = currentCampusIds.filter(id => id !== campusId)
    } else {
      // Add the campus
      newCampusIds = [...currentCampusIds, campusId]
    }

    onCampusesChange(member.id, newCampusIds)
  }

  // Render a cell based on column key
  const renderCell = (columnKey: PeopleColumnKey): React.ReactNode => {
    // Handle custom fields
    if (columnKey.startsWith('cf_')) {
      const fieldId = columnKey.replace('cf_', '')
      const field = customFields.find(f => f.id === fieldId)
      if (!field) return null
      const value = member.custom_field_values?.[field.id]
      const isUpdating = updatingCustomFieldKey === `${member.id}:${field.id}`
      return (
        <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses(columnKey))} style={getColumnStyle(columnKey)}>
          <CustomFieldCell
            field={field}
            value={value}
            memberId={member.id}
            canEdit={canEditFields}
            isUpdating={isUpdating}
            onValueChange={(fId, newValue) => onCustomFieldChange(member.id, fId, newValue)}
          />
        </TableCell>
      )
    }

    // Standard columns
    switch (columnKey) {
      case 'active':
        return (
          <TableCell key={columnKey} className={getFrozenClasses('active')} style={getColumnStyle('active')}>
            <Checkbox
              checked={member.active}
              onCheckedChange={(checked) => onActiveChange(member.id, checked as boolean)}
              disabled={!canEditActiveStatus || isUpdatingActive}
              className={isUpdatingActive ? 'opacity-50' : ''}
            />
          </TableCell>
        )

      case 'name':
        return (
          <TableCell key={columnKey} className={cn('font-medium', getFrozenClasses('name'))} style={getColumnStyle('name')}>
            <div className="flex items-center gap-2">
              <span>{member.first_name} {member.last_name}</span>
              {member.id === currentUserId && (
                <span className="text-xs text-muted-foreground">{t('you')}</span>
              )}
              {member.member_type === 'offline' && (
                <span className="inline-flex items-center bg-amber-50 text-amber-700 border-amber-200 border rounded-full px-2 py-0.5 text-xs font-medium">
                  {t('offline')}
                </span>
              )}
              {member.member_type === 'offline' && canDeleteOffline && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => onDeleteOffline(member)}
                  title={t('deleteOffline.button')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </TableCell>
        )

      case 'email':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('email'))} style={getColumnStyle('email')}>
            {canEditOfflineProfile ? (
              <Popover open={emailPopoverOpen} onOpenChange={(open) => {
                setEmailPopoverOpen(open)
                if (open) setEmailValue(member.email || '')
              }}>
                <PopoverTrigger asChild>
                  <button
                    disabled={isUpdatingProfile}
                    className={cn(
                      'h-8 text-sm text-left rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                      !member.email && 'text-muted-foreground/50',
                      isUpdatingProfile && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {member.email || '—'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg" align="start">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder={t('offlineMember.emailPlaceholder')}
                      className="!border !border-black dark:!border-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="!border !border-black dark:!border-white"
                        onClick={() => setEmailPopoverOpen(false)}
                      >
                        {t('actions.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        disabled={isUpdatingProfile}
                        onClick={() => {
                          onProfileChange(member.id, { email: emailValue || null })
                          setEmailPopoverOpen(false)
                        }}
                      >
                        {isUpdatingProfile ? t('actions.saving') : t('actions.save')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              member.email || '—'
            )}
          </TableCell>
        )

      case 'phone':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('phone'))} style={getColumnStyle('phone')}>
            {canEditOfflineProfile ? (
              <Popover open={phonePopoverOpen} onOpenChange={(open) => {
                setPhonePopoverOpen(open)
                if (open) setPhoneValue(member.phone || '')
              }}>
                <PopoverTrigger asChild>
                  <button
                    disabled={isUpdatingProfile}
                    className={cn(
                      'h-8 text-sm text-left rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                      !member.phone && 'text-muted-foreground/50',
                      isUpdatingProfile && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {member.phone || '—'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg" align="start">
                  <div className="space-y-2">
                    <Input
                      type="tel"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      placeholder={t('offlineMember.phonePlaceholder')}
                      className="!border !border-black dark:!border-white"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="!border !border-black dark:!border-white"
                        onClick={() => setPhonePopoverOpen(false)}
                      >
                        {t('actions.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        disabled={isUpdatingProfile}
                        onClick={() => {
                          onProfileChange(member.id, { phone: phoneValue || null })
                          setPhonePopoverOpen(false)
                        }}
                      >
                        {isUpdatingProfile ? t('actions.saving') : t('actions.save')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              member.phone || '—'
            )}
          </TableCell>
        )

      case 'role':
        return (
          <TableCell key={columnKey} className={getFrozenClasses('role')} style={getColumnStyle('role')}>
            {canEditRole ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isUpdatingRole}>
                  <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                    <span
                      className={`cursor-pointer hover:opacity-80 transition-opacity ${getRoleBadgeClasses(member.role)} ${isUpdatingRole ? 'opacity-50' : ''}`}
                    >
                      {isUpdatingRole ? t('table.updating') : member.role}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="p-2">
                  {assignableRoles.map((role) => {
                    const colors = roleColors[role]
                    const isCurrentRole = role === member.role
                    return (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => !isCurrentRole && onRoleChange(member.id, role)}
                        className={`cursor-pointer rounded-full my-1 px-3 py-1.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border ${!isCurrentRole ? colors.hoverBg : 'opacity-50'}`}
                      >
                        {role}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className={getRoleBadgeClasses(member.role)}>
                {member.role}
              </span>
            )}
          </TableCell>
        )

      case 'campus':
        return (
          <TableCell key={columnKey} className={getFrozenClasses('campus')} style={getColumnStyle('campus')}>
            {canEditFields ? (
              <Popover open={campusPopoverOpen} onOpenChange={setCampusPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center gap-1 px-1 py-0.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-w-[60px]',
                      isUpdatingCampuses && 'opacity-50 pointer-events-none'
                    )}
                    disabled={isUpdatingCampuses}
                  >
                    {member.campuses && member.campuses.length > 0 ? (
                      <CampusBadges
                        campuses={member.campuses}
                        size="sm"
                        maxVisible={2}
                      />
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">—</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg" align="start">
                  <div className="space-y-1">
                    {allCampuses.map((campus) => {
                      const isSelected = currentCampusIds.includes(campus.id)
                      return (
                        <button
                          key={campus.id}
                          onClick={() => handleCampusToggle(campus.id)}
                          disabled={isUpdatingCampuses}
                          className={cn(
                            'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors',
                            isUpdatingCampuses && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div
                            className={cn(
                              'h-4 w-4 rounded border flex items-center justify-center',
                              isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <CampusBadge
                            name={campus.name}
                            color={campus.color}
                            size="sm"
                          />
                        </button>
                      )
                    })}
                    {allCampuses.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">No campuses available</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              member.campuses && member.campuses.length > 0 ? (
                <CampusBadges
                  campuses={member.campuses}
                  size="sm"
                  maxVisible={2}
                />
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )
            )}
          </TableCell>
        )

      case 'ministry_roles':
        return (
          <TableCell key={columnKey} className={getFrozenClasses('ministry_roles')} style={getColumnStyle('ministry_roles')}>
            <div className="flex flex-wrap gap-1.5">
              {member.ministry_members && member.ministry_members.length > 0 ? (
                member.ministry_members
                  .filter(mm => {
                    const role = Array.isArray(mm.role) ? mm.role[0] : mm.role
                    const ministry = Array.isArray(mm.ministry) ? mm.ministry[0] : mm.ministry
                    return role && ministry
                  })
                  .map((mm) => {
                    const role = Array.isArray(mm.role) ? mm.role[0] : mm.role
                    const ministry = Array.isArray(mm.ministry) ? mm.ministry[0] : mm.ministry
                    return (
                      <span
                        key={mm.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${ministry!.color}15`,
                          color: ministry!.color,
                          borderColor: `${ministry!.color}30`,
                        }}
                        title={ministry!.name}
                      >
                        {role!.name}
                      </span>
                    )
                  })
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </TableCell>
        )

      case 'gender':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('gender'))} style={getColumnStyle('gender')}>
            {canEditOfflineProfile ? (
              <Select
                value={member.sex || ''}
                onValueChange={(value) => onProfileChange(member.id, { sex: value || null })}
                disabled={isUpdatingProfile}
              >
                <SelectTrigger className={cn(
                  'w-24 h-8 text-xs !border !border-black dark:!border-white',
                  isUpdatingProfile && 'opacity-50'
                )}>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="border border-black dark:border-white">
                  <SelectItem value="male">{t('sex.male')}</SelectItem>
                  <SelectItem value="female">{t('sex.female')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              member.sex ? t(`sex.${member.sex}`) : '—'
            )}
          </TableCell>
        )

      case 'date_of_birth':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('date_of_birth'))} style={getColumnStyle('date_of_birth')}>
            {canEditOfflineProfile ? (
              <InlineDateEditor
                value={member.date_of_birth}
                onChange={(date) => onProfileChange(member.id, { dateOfBirth: date })}
                disabled={isUpdatingProfile}
                canEdit={true}
              />
            ) : (
              formatDateOfBirth(member.date_of_birth)
            )}
          </TableCell>
        )

      case 'age':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('age'))} style={getColumnStyle('age')}>
            {calculateAge(member.date_of_birth)}
          </TableCell>
        )

      case 'baptized':
        return (
          <TableCell key={columnKey} className={getFrozenClasses('baptized')} style={getColumnStyle('baptized')}>
            <Checkbox
              checked={member.baptism}
              onCheckedChange={(checked) => {
                const newBaptism = checked as boolean
                onBaptismChange(member.id, newBaptism, newBaptism ? member.baptism_date : null)
              }}
              disabled={!canEditFields || isUpdatingBaptism}
              className={isUpdatingBaptism ? 'opacity-50' : ''}
            />
          </TableCell>
        )

      case 'baptism_date':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('baptism_date'))} style={getColumnStyle('baptism_date')}>
            <InlineDateEditor
              value={member.baptism_date}
              onChange={(date) => onBaptismChange(member.id, date ? true : member.baptism, date)}
              disabled={isUpdatingBaptism}
              canEdit={canEditFields}
            />
          </TableCell>
        )

      case 'departure_date':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('departure_date'))} style={getColumnStyle('departure_date')}>
            <InlineDateEditor
              value={member.date_of_departure}
              onChange={(date) => onDepartureChange(member.id, date, member.reason_for_departure)}
              disabled={isUpdatingDeparture}
              canEdit={canEditDeparture}
            />
          </TableCell>
        )

      case 'departure_reason':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('departure_reason'))} style={getColumnStyle('departure_reason')}>
            {canEditDeparture ? (
              <Popover open={departurePopoverOpen} onOpenChange={setDeparturePopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="text-left text-sm hover:bg-muted px-2 py-1 rounded min-w-[100px] max-w-[200px] truncate">
                    {member.reason_for_departure || '—'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white dark:bg-zinc-950 border shadow-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('table.reasonForDeparture')}</label>
                    <Textarea
                      defaultValue={member.reason_for_departure || ''}
                      placeholder={t('table.enterReason')}
                      className="min-h-[80px]"
                      id={`reason-${member.id}`}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="!border !border-black dark:!border-white"
                        onClick={() => setDeparturePopoverOpen(false)}
                      >
                        {t('actions.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        disabled={isUpdatingDeparture}
                        onClick={() => {
                          const textarea = document.getElementById(`reason-${member.id}`) as HTMLTextAreaElement
                          onDepartureChange(member.id, member.date_of_departure, textarea.value || null)
                          setDeparturePopoverOpen(false)
                        }}
                      >
                        {isUpdatingDeparture ? t('actions.saving') : t('actions.save')}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span className="px-2 py-1 inline-block">{member.reason_for_departure || '—'}</span>
            )}
          </TableCell>
        )

      case 'joined':
        return (
          <TableCell key={columnKey} className={cn('text-muted-foreground', getFrozenClasses('joined'))} style={getColumnStyle('joined')}>
            {formatDate(member.created_at)}
          </TableCell>
        )

      default:
        return null
    }
  }

  // If orderedColumns is provided, render cells in that order
  if (orderedColumns) {
    return (
      <TableRow className={cn(
        index % 2 === 0 && 'bg-zinc-100 dark:bg-zinc-800',
        !member.active && 'opacity-50'
      )}>
        {orderedColumns.map((column) => {
          if (!show(column.key)) return null
          return renderCell(column.key)
        })}
      </TableRow>
    )
  }

  // Legacy fallback: hardcoded column order (uses renderCell for DRY)
  const legacyColumnOrder: PeopleColumnKey[] = [
    'active', 'name', 'email', 'phone', 'role', 'campus', 'ministry_roles',
    'gender', 'date_of_birth', 'age', 'baptized', 'baptism_date',
    'departure_date', 'departure_reason', 'joined',
    ...customFields.map(f => getColumnKeyForField(f.id)),
  ]

  return (
    <TableRow className={cn(
      index % 2 === 0 && 'bg-zinc-100 dark:bg-zinc-800',
      !member.active && 'opacity-50'
    )}>
      {legacyColumnOrder.map((columnKey) => {
        if (!show(columnKey)) return null
        return renderCell(columnKey)
      })}
    </TableRow>
  )
})
