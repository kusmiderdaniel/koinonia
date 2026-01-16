'use client'

import { useCallback } from 'react'
import { useMinistryMembersWithUnavailability } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { MemberListItem, UnassignedOption } from '@/components/pickers/MemberListItem'
import { getMinistryMembersForAgenda } from '../../actions'
import { getUnavailabilityForDate } from '@/app/dashboard/availability/actions'

interface LeaderPickerProps {
  ministryId: string
  eventDate: string
  currentLeaderId: string | null
  onSelectLeader: (leaderId: string | null, leaderName: string | null) => void
  onBack: () => void
  disabled?: boolean
}

export function LeaderPicker({
  ministryId,
  eventDate,
  currentLeaderId,
  onSelectLeader,
  onBack,
  disabled = false,
}: LeaderPickerProps) {
  const {
    members,
    sortedMembers,
    unavailableIds,
    unavailabilityReasons,
    search,
    setSearch,
    isLoading,
    error,
  } = useMinistryMembersWithUnavailability({
    fetchMembers: useCallback(() => getMinistryMembersForAgenda(ministryId), [ministryId]),
    fetchUnavailability: getUnavailabilityForDate,
    eventDate,
    enabled: true,
  })

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-2"
      >
        ← Back
      </Button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Member List */}
      <div className="max-h-[250px] overflow-y-auto -mx-4 px-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading members...
          </p>
        ) : (
          <div className="space-y-1">
            {/* Unassign option */}
            <UnassignedOption
              isSelected={currentLeaderId === null}
              disabled={disabled}
              onClick={() => onSelectLeader(null, null)}
            />

            {sortedMembers.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {members.length === 0
                  ? 'No members in this ministry'
                  : 'No members found matching your search'}
              </p>
            ) : (
              sortedMembers.map((member) => (
                <MemberListItem
                  key={member.id}
                  id={member.id}
                  firstName={member.first_name}
                  lastName={member.last_name}
                  showEmail={false}
                  isSelected={currentLeaderId === member.id}
                  isUnavailable={unavailableIds.has(member.id)}
                  unavailabilityReason={unavailabilityReasons.get(member.id)}
                  disabled={disabled}
                  onClick={() => onSelectLeader(member.id, `${member.first_name} ${member.last_name}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}
