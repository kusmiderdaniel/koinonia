'use client'

import { useState, useMemo, memo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, UserPlus } from 'lucide-react'
import { SmartVirtualizedList } from '@/components/VirtualizedList'

interface ChurchMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
}

interface MinistryRole {
  id: string
  name: string
}

interface MinistryInfo {
  id: string
  name: string
  members: {
    profile_id: string
    role_names: string[]
  }[]
}

interface MemberPickerProps {
  availableMembers: ChurchMember[]
  ministryRoles: MinistryRole[]
  allMinistries: MinistryInfo[]
  currentMinistryId: string
  onAdd: (memberId: string, roleIds: string[]) => Promise<void>
  isAdding: boolean
}

export const MemberPicker = memo(function MemberPicker({
  availableMembers,
  ministryRoles,
  allMinistries,
  currentMinistryId,
  onAdd,
  isAdding,
}: MemberPickerProps) {
  const t = useTranslations('ministries')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  // Filter members by search (debounced for performance)
  const filteredMembers = useMemo(() => {
    if (!debouncedSearch.trim()) return availableMembers

    const searchLower = debouncedSearch.toLowerCase()
    return availableMembers.filter(
      (member) =>
        member.first_name.toLowerCase().includes(searchLower) ||
        member.last_name.toLowerCase().includes(searchLower) ||
        (member.email?.toLowerCase().includes(searchLower) ?? false)
    )
  }, [availableMembers, debouncedSearch])

  // Get ministries a person is part of (excluding current ministry)
  const getMemberMinistries = (memberId: string) => {
    return allMinistries
      .filter((m) => m.id !== currentMinistryId)
      .filter((m) => m.members.some((member) => member.profile_id === memberId))
      .map((m) => {
        const memberInfo = m.members.find((member) => member.profile_id === memberId)
        return {
          name: m.name,
          roles: memberInfo?.role_names || [],
        }
      })
  }

  const handleSelect = useCallback((memberId: string) => {
    setSelectedMemberId(memberId)
    setSelectedRoleIds([]) // Reset role selection when changing member
  }, [])

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleAdd = async () => {
    if (!selectedMemberId) return

    await onAdd(selectedMemberId, selectedRoleIds)
    setOpen(false)
    setSearch('')
    setSelectedMemberId(null)
    setSelectedRoleIds([])
  }

  const handleCancel = () => {
    setOpen(false)
    setSearch('')
    setSelectedMemberId(null)
    setSelectedRoleIds([])
  }

  const selectedMember = availableMembers.find((m) => m.id === selectedMemberId)

  return (
    <>
      <Button variant="ghost" className="rounded-full !border !border-black dark:!border-white" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4 mr-1" />
        {t('members.addMember')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle>{t('members.addMemberToMinistry')}</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('members.searchByName')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Member List */}
          <SmartVirtualizedList
            items={filteredMembers}
            estimateSize={72}
            className="max-h-[300px] -mx-4 px-4"
            virtualizationThreshold={50}
            emptyMessage={
              <p className="text-sm text-muted-foreground text-center py-4">
                {availableMembers.length === 0
                  ? t('members.allMembersInMinistry')
                  : t('members.noMembersFound')}
              </p>
            }
            renderItem={(member) => {
              const memberMinistries = getMemberMinistries(member.id)
              const isSelected = selectedMemberId === member.id

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 border-2'
                      : 'border-black dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="font-medium">
                    {member.first_name} {member.last_name}
                  </div>
                  {member.email && (
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                  )}
                  {memberMinistries.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {memberMinistries.map((m, i) => (
                        <span key={i}>
                          {i > 0 && ' · '}
                          {m.name}
                          {m.roles.length > 0 && ` (${m.roles.join(', ')})`}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              )
            }}
          />

          {/* Role Selection with Checkboxes */}
          {selectedMember && ministryRoles.length > 0 && (
            <div className="space-y-3 pt-3 border-t">
              <label className="text-sm font-medium">{t('members.assignRoles')}</label>
              <div className="space-y-2">
                {ministryRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <label
                      htmlFor={`role-${role.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline-pill" onClick={handleCancel} disabled={isAdding} className="!border !border-black dark:!border-white">
              {t('actions.cancel')}
            </Button>
            <Button variant="outline-pill" onClick={handleAdd} disabled={!selectedMemberId || isAdding} className="!bg-brand hover:!bg-brand/90 !text-white !border-0">
              {isAdding ? t('actions.adding') : t('members.addMember')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
