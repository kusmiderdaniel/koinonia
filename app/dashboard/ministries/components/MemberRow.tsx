'use client'

import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Trash2 } from 'lucide-react'
import type { Role, MinistryMember } from '../types'

interface MemberRowProps {
  member: MinistryMember
  allRoles: Role[]
  canManage: boolean
  onUpdateRoles: (roleIds: string[]) => void
  onRemove: () => void
}

export const MemberRow = memo(function MemberRow({
  member,
  allRoles,
  canManage,
  onUpdateRoles,
  onRemove,
}: MemberRowProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    member.roles.map((r) => r.id)
  )
  const [isOpen, setIsOpen] = useState(false)

  const handleRoleToggle = (roleId: string) => {
    const newRoleIds = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter((id) => id !== roleId)
      : [...selectedRoleIds, roleId]
    setSelectedRoleIds(newRoleIds)
  }

  const handleSave = () => {
    onUpdateRoles(selectedRoleIds)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setSelectedRoleIds(member.roles.map((r) => r.id))
    setIsOpen(false)
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border gap-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0">
          <p className="font-medium truncate">
            {member.profile.first_name} {member.profile.last_name}
          </p>
          {member.profile.email && (
            <p className="text-sm text-muted-foreground truncate hidden md:block">
              {member.profile.email}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {canManage && allRoles.length > 0 ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="justify-between min-w-[80px] md:min-w-[140px] !border !border-black dark:!border-white text-sm">
                {member.roles.length === 0 ? (
                  <span className="text-muted-foreground">No roles</span>
                ) : member.roles.length === 1 ? (
                  <span>{member.roles[0].name}</span>
                ) : (
                  <span>{member.roles.length} roles</span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 bg-white dark:bg-zinc-950 border border-black dark:border-white" align="end">
              <div className="space-y-2">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-role-${member.id}-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <label
                      htmlFor={`member-role-${member.id}-${role.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={handleCancel} className="!border !border-black dark:!border-white">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="!bg-brand hover:!bg-brand/90 !text-white">
                  Save
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex flex-wrap gap-1">
            {member.roles.length === 0 ? (
              <span className="text-sm text-muted-foreground">No roles</span>
            ) : (
              member.roles.map((role) => (
                <Badge key={role.id} variant="secondary">
                  {role.name}
                </Badge>
              ))
            )}
          </div>
        )}
        {canManage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
})
