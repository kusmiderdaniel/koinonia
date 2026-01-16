'use client'

import { useState, useCallback } from 'react'
import { useMinistryMembersWithUnavailability } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, User } from 'lucide-react'
import { MemberListItem, UnassignedOption } from '@/components/pickers/MemberListItem'
import { getMinistryMembersForAgenda, updateAgendaItemLeader } from '../actions'
import { getUnavailabilityForDate } from '@/app/dashboard/availability/actions'

export interface LeaderPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendaItemId: string
  ministryId: string
  currentLeaderId: string | null
  eventDate: string
  onSuccess: () => void
}

export function LeaderPicker({
  open,
  onOpenChange,
  agendaItemId,
  ministryId,
  currentLeaderId,
  eventDate,
  onSuccess,
}: LeaderPickerProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const {
    members,
    sortedMembers,
    unavailableIds,
    unavailabilityReasons,
    search,
    setSearch,
    isLoading,
    error: fetchError,
  } = useMinistryMembersWithUnavailability({
    fetchMembers: useCallback(() => getMinistryMembersForAgenda(ministryId), [ministryId]),
    fetchUnavailability: getUnavailabilityForDate,
    eventDate,
    enabled: open && !!ministryId,
  })

  const error = assignError || fetchError

  const handleAssign = useCallback(async (leaderId: string | null) => {
    setIsAssigning(true)
    setAssignError(null)

    const result = await updateAgendaItemLeader(agendaItemId, leaderId)

    if (result.error) {
      setAssignError(result.error)
      setIsAssigning(false)
    } else {
      setIsAssigning(false)
      onSuccess()
    }
  }, [agendaItemId, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Assign Leader
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
            {error}
          </div>
        )}

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
        <div className="max-h-[300px] overflow-y-auto -mx-4 px-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading members...
            </p>
          ) : (
            <div className="space-y-1">
              {/* Unassign option */}
              <UnassignedOption
                isSelected={currentLeaderId === null}
                disabled={isAssigning}
                onClick={() => handleAssign(null)}
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
                    email={member.email}
                    isSelected={currentLeaderId === member.id}
                    isUnavailable={unavailableIds.has(member.id)}
                    unavailabilityReason={unavailabilityReasons.get(member.id)}
                    disabled={isAssigning}
                    onClick={() => handleAssign(member.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
