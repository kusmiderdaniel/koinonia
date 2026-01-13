'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { TableCell } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { roleColors, assignableRoles, getRoleBadgeClasses } from '../member-table-types'
import type { RoleCellProps } from './types'

export const RoleCell = memo(function RoleCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditRole,
  isUpdatingRole,
  onRoleChange,
}: RoleCellProps) {
  const t = useTranslations('people')

  return (
    <TableCell className={getFrozenClasses(columnKey)} style={getColumnStyle(columnKey)}>
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
        <span className={getRoleBadgeClasses(member.role)}>{member.role}</span>
      )}
    </TableCell>
  )
})
