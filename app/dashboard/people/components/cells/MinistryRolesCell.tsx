'use client'

import { memo } from 'react'
import { TableCell } from '@/components/ui/table'
import type { MinistryRolesCellProps } from './types'

export const MinistryRolesCell = memo(function MinistryRolesCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
}: MinistryRolesCellProps) {
  return (
    <TableCell className={getFrozenClasses(columnKey)} style={getColumnStyle(columnKey)}>
      <div className="flex flex-wrap gap-1.5">
        {member.ministry_members && member.ministry_members.length > 0 ? (
          member.ministry_members
            .filter((mm) => {
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
})
