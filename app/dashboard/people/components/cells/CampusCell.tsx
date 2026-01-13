'use client'

import { useState, memo } from 'react'
import { Check } from 'lucide-react'
import { TableCell } from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CampusBadge, CampusBadges } from '@/components/CampusBadge'
import { cn } from '@/lib/utils'
import type { CampusCellProps } from './types'

export const CampusCell = memo(function CampusCell({
  member,
  columnKey,
  getColumnStyle,
  getFrozenClasses,
  canEditFields,
  isUpdatingCampuses,
  allCampuses,
  onCampusesChange,
}: CampusCellProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const currentCampusIds = member.campuses.map((c) => c.id)

  const handleCampusToggle = (campusId: string) => {
    const isSelected = currentCampusIds.includes(campusId)
    let newCampusIds: string[]

    if (isSelected) {
      newCampusIds = currentCampusIds.filter((id) => id !== campusId)
    } else {
      newCampusIds = [...currentCampusIds, campusId]
    }

    onCampusesChange(member.id, newCampusIds)
  }

  return (
    <TableCell className={getFrozenClasses(columnKey)} style={getColumnStyle(columnKey)}>
      {canEditFields ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1 px-1 py-0.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-w-[60px]',
                isUpdatingCampuses && 'opacity-50 pointer-events-none'
              )}
              disabled={isUpdatingCampuses}
            >
              {member.campuses && member.campuses.length > 0 ? (
                <CampusBadges campuses={member.campuses} size="sm" maxVisible={2} />
              ) : (
                <span className="text-muted-foreground/50 text-sm">—</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-2 bg-white dark:bg-zinc-950 border border-black dark:border-white shadow-lg"
            align="start"
          >
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
                    <CampusBadge name={campus.name} color={campus.color} size="sm" />
                  </button>
                )
              })}
              {allCampuses.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No campuses available
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : member.campuses && member.campuses.length > 0 ? (
        <CampusBadges campuses={member.campuses} size="sm" maxVisible={2} />
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )}
    </TableCell>
  )
})
