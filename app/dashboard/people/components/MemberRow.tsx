'use client'

import { useState, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
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

interface AvailableCampus {
  id: string
  name: string
  color: string
  is_default: boolean
}

interface MemberRowProps {
  member: Member
  currentUserId: string
  canEditRole: boolean
  canEditActiveStatus: boolean
  canEditDeparture: boolean
  canEditFields: boolean
  isUpdatingRole: boolean
  isUpdatingActive: boolean
  isUpdatingDeparture: boolean
  isUpdatingBaptism: boolean
  isUpdatingCampuses: boolean
  isUpdatingProfile: boolean
  allCampuses: AvailableCampus[]
  onRoleChange: (memberId: string, newRole: AssignableRole) => void
  onActiveChange: (memberId: string, active: boolean) => void
  onDepartureChange: (memberId: string, date: string | null, reason: string | null) => void
  onBaptismChange: (memberId: string, baptism: boolean, date: string | null) => void
  onCampusesChange: (memberId: string, campusIds: string[]) => void
  onProfileChange: (memberId: string, data: { sex?: string | null; dateOfBirth?: string | null; phone?: string | null }) => void
}

export const MemberRow = memo(function MemberRow({
  member,
  currentUserId,
  canEditRole,
  canEditActiveStatus,
  canEditDeparture,
  canEditFields,
  isUpdatingRole,
  isUpdatingActive,
  isUpdatingDeparture,
  isUpdatingBaptism,
  isUpdatingCampuses,
  isUpdatingProfile,
  allCampuses,
  onRoleChange,
  onActiveChange,
  onDepartureChange,
  onBaptismChange,
  onCampusesChange,
  onProfileChange,
}: MemberRowProps) {
  const t = useTranslations('people')
  const [departurePopoverOpen, setDeparturePopoverOpen] = useState(false)
  const [campusPopoverOpen, setCampusPopoverOpen] = useState(false)

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

  return (
    <TableRow className={!member.active ? 'opacity-50' : ''}>
      {/* Active Checkbox */}
      <TableCell>
        <Checkbox
          checked={member.active}
          onCheckedChange={(checked) => onActiveChange(member.id, checked as boolean)}
          disabled={!canEditActiveStatus || isUpdatingActive}
          className={isUpdatingActive ? 'opacity-50' : ''}
        />
      </TableCell>

      {/* Name */}
      <TableCell className="font-medium">
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
        </div>
      </TableCell>

      {/* Email */}
      <TableCell>{member.email || '—'}</TableCell>

      {/* Role */}
      <TableCell>
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

      {/* Campus */}
      <TableCell>
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

      {/* Ministry Roles */}
      <TableCell>
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

      {/* Gender */}
      <TableCell className="text-muted-foreground capitalize">
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
          member.sex || '—'
        )}
      </TableCell>

      {/* Date of Birth */}
      <TableCell className="text-muted-foreground">
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

      {/* Age */}
      <TableCell className="text-muted-foreground">
        {calculateAge(member.date_of_birth)}
      </TableCell>

      {/* Baptized Checkbox */}
      <TableCell>
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

      {/* Baptism Date */}
      <TableCell className="text-muted-foreground">
        <InlineDateEditor
          value={member.baptism_date}
          onChange={(date) => onBaptismChange(member.id, date ? true : member.baptism, date)}
          disabled={isUpdatingBaptism}
          canEdit={canEditFields}
        />
      </TableCell>

      {/* Departure Date */}
      <TableCell className="text-muted-foreground">
        <InlineDateEditor
          value={member.date_of_departure}
          onChange={(date) => onDepartureChange(member.id, date, member.reason_for_departure)}
          disabled={isUpdatingDeparture}
          canEdit={canEditDeparture}
        />
      </TableCell>

      {/* Departure Reason */}
      <TableCell className="text-muted-foreground">
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

      {/* Joined Date */}
      <TableCell className="text-muted-foreground">
        {formatDate(member.created_at)}
      </TableCell>
    </TableRow>
  )
})
