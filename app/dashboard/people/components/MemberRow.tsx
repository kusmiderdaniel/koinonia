'use client'

import { useState, memo } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { CampusBadge, CampusBadges } from '@/components/CampusBadge'
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
  onRoleChange: (memberId: string, newRole: AssignableRole) => void
  onActiveChange: (memberId: string, active: boolean) => void
  onDepartureChange: (memberId: string, date: string | null, reason: string | null) => void
  onBaptismChange: (memberId: string, baptism: boolean, date: string | null) => void
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
  onRoleChange,
  onActiveChange,
  onDepartureChange,
  onBaptismChange,
}: MemberRowProps) {
  const [departurePopoverOpen, setDeparturePopoverOpen] = useState(false)

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
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
          {member.member_type === 'offline' && (
            <span className="inline-flex items-center bg-amber-50 text-amber-700 border-amber-200 border rounded-full px-2 py-0.5 text-xs font-medium">
              Offline
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
                  {isUpdatingRole ? 'Updating...' : member.role}
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
        {member.campuses && member.campuses.length > 0 ? (
          <CampusBadges
            campuses={member.campuses}
            size="sm"
            maxVisible={2}
          />
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
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
        {member.sex || '—'}
      </TableCell>

      {/* Date of Birth */}
      <TableCell className="text-muted-foreground">
        {formatDateOfBirth(member.date_of_birth)}
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
                <label className="text-sm font-medium">Reason for Departure</label>
                <Textarea
                  defaultValue={member.reason_for_departure || ''}
                  placeholder="Enter reason for departure..."
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
                    Cancel
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
                    {isUpdatingDeparture ? 'Saving...' : 'Save'}
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
