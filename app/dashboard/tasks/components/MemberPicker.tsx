'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('tasks')

  return (
    <EntityPicker
      open={open}
      onOpenChange={onOpenChange}
      items={members}
      selectedId={currentAssigneeId}
      onSelect={onSelect}
      title={t('memberPicker.title')}
      description={t('memberPicker.description')}
      searchPlaceholder={t('memberPicker.searchPlaceholder')}
      getSearchableText={(member) => `${member.first_name} ${member.last_name}`}
      allowClear={!!currentAssigneeId}
      clearLabel={t('memberPicker.unassign')}
      emptyMessage={t('memberPicker.noMembersFound')}
      noResultsMessage={t('memberPicker.noMembersMatch')}
      renderItem={(member, isSelected) => (
        <>
          <span className="font-medium">
            {member.first_name} {member.last_name}
          </span>
          {isSelected && (
            <span className="ml-2 text-xs text-brand">{t('memberPicker.currentlyAssigned')}</span>
          )}
        </>
      )}
    />
  )
})
