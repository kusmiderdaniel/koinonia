'use client'

import { useState, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CampusBadges } from '@/components/CampusBadge'
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

interface MemberCardProps {
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

export const MemberCard = memo(function MemberCard({
  member,
  currentUserId,
  canEditRole,
  canEditActiveStatus,
  isUpdatingRole,
  isUpdatingActive,
  onRoleChange,
  onActiveChange,
}: MemberCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`p-3 ${!member.active ? 'opacity-60' : ''}`}>
      {/* Primary Row - Name | Role | Expand Arrow */}
      <div className="flex items-center gap-3">
        {/* Active Checkbox */}
        <Checkbox
          checked={member.active}
          onCheckedChange={(checked) => onActiveChange(member.id, checked as boolean)}
          disabled={!canEditActiveStatus || isUpdatingActive}
          className={`flex-shrink-0 ${isUpdatingActive ? 'opacity-50' : ''}`}
        />

        {/* Name Column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium truncate">
              {member.first_name} {member.last_name}
            </span>
            {member.id === currentUserId && (
              <span className="text-xs text-muted-foreground flex-shrink-0">(you)</span>
            )}
            {member.member_type === 'offline' && (
              <span className="inline-flex items-center bg-amber-50 text-amber-700 border-amber-200 border rounded-full px-1.5 py-0.5 text-[10px] font-medium flex-shrink-0">
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex-shrink-0">
          {canEditRole ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isUpdatingRole}>
                <button className="focus:outline-none">
                  <span
                    className={`cursor-pointer ${getRoleBadgeClasses(member.role)} ${isUpdatingRole ? 'opacity-50' : ''}`}
                  >
                    {isUpdatingRole ? '...' : member.role}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-2">
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
        </div>

        {/* Expand/Collapse Arrow */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1.5 -mr-1.5 rounded-full hover:bg-muted text-muted-foreground"
        >
          {expanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expandable Section */}
      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3 ml-7">
          {/* Email */}
          <p className="text-sm text-muted-foreground">
            {member.email || 'No email'}
          </p>

          {/* Campus */}
          {member.campuses && member.campuses.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Campus:</span>
              <CampusBadges campuses={member.campuses} size="sm" maxVisible={3} />
            </div>
          )}

          {/* Ministry Roles */}
          {member.ministry_members && member.ministry_members.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {member.ministry_members
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
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
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
                })}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Gender:</span>
              <span className="ml-1.5 capitalize">{member.sex || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Age:</span>
              <span className="ml-1.5">{calculateAge(member.date_of_birth)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">DOB:</span>
              <span className="ml-1.5">{formatDateOfBirth(member.date_of_birth)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Joined:</span>
              <span className="ml-1.5">{formatDate(member.created_at)}</span>
            </div>
          </div>

          {/* Baptism Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Baptized:</span>
              <span>{member.baptism ? 'Yes' : 'No'}</span>
            </div>
            {member.baptism && member.baptism_date && (
              <div>
                <span className="text-muted-foreground">Date:</span>
                <span className="ml-1.5">{formatDate(member.baptism_date)}</span>
              </div>
            )}
          </div>

          {/* Departure Info */}
          {(member.date_of_departure || member.reason_for_departure) && (
            <div className="text-sm">
              {member.date_of_departure && (
                <div>
                  <span className="text-muted-foreground">Departure:</span>
                  <span className="ml-1.5">{formatDate(member.date_of_departure)}</span>
                </div>
              )}
              {member.reason_for_departure && (
                <div className="mt-1">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="ml-1.5">{member.reason_for_departure}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
})
