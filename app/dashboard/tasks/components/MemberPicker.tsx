'use client'

import { memo } from 'react'
import { EntityPicker } from '@/components/pickers'
import type { Person } from '../types'

interface MemberPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Person[]
  currentAssigneeId: string | null
  onSelect: (memberId: string | null) => void
}

export const MemberPicker = memo(function MemberPicker({
  open,
  onOpenChange,
  members,
  currentAssigneeId,
  onSelect,
}: MemberPickerProps) {
  return (
    <EntityPicker
      open={open}
      onOpenChange={onOpenChange}
      items={members}
      selectedId={currentAssigneeId}
      onSelect={onSelect}
      title="Assign Member"
      description="Select a church member to assign to this task"
      searchPlaceholder="Search by name..."
      getSearchableText={(member) => `${member.first_name} ${member.last_name}`}
      allowClear={!!currentAssigneeId}
      clearLabel="Unassign task"
      emptyMessage="No members found"
      noResultsMessage="No members found matching your search"
      renderItem={(member, isSelected) => (
        <>
          <span className="font-medium">
            {member.first_name} {member.last_name}
          </span>
          {isSelected && (
            <span className="ml-2 text-xs text-brand">(Currently assigned)</span>
          )}
        </>
      )}
    />
  )
})
