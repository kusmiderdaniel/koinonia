'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, User, AlertCircle } from 'lucide-react'
import { getMinistryMembersForAgenda, updateAgendaItemLeader } from '../actions'
import { getUnavailabilityForDate } from '@/app/dashboard/availability/actions'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

interface UnavailabilityInfo {
  profile_id: string
  reason: string | null
}

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
  const [members, setMembers] = useState<Member[]>([])
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())
  const [unavailabilityReasons, setUnavailabilityReasons] = useState<Map<string, string | null>>(new Map())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

   
  useEffect(() => {
    if (open && ministryId) {
      setIsLoading(true)
      setSearch('')
      setError(null)

      getMinistryMembersForAgenda(ministryId).then(async (result) => {
        if (result.error) {
          setError(result.error)
          setIsLoading(false)
          return
        }

        // Filter out any null values from the result
        const validMembers = (result.data || []).filter((m): m is Member => m !== null)
        setMembers(validMembers)

        // Fetch unavailability for these members on the event date
        if (validMembers.length > 0 && eventDate) {
          const profileIds = validMembers.map((m) => m.id)
          const unavailResult = await getUnavailabilityForDate(eventDate, profileIds)

          if (!unavailResult.error && unavailResult.data) {
            const unavailSet = new Set(unavailResult.data.map((u: UnavailabilityInfo) => u.profile_id))
            setUnavailableIds(unavailSet)

            const reasonsMap = new Map<string, string | null>()
            unavailResult.data.forEach((u: UnavailabilityInfo) => {
              reasonsMap.set(u.profile_id, u.reason)
            })
            setUnavailabilityReasons(reasonsMap)
          }
        }

        setIsLoading(false)
      })
    }
  }, [open, ministryId, eventDate])

  const filteredMembers = useMemo(() => {
    if (!debouncedSearch.trim()) return members

    const searchLower = debouncedSearch.toLowerCase()
    return members.filter(
      (m) =>
        m.first_name.toLowerCase().includes(searchLower) ||
        m.last_name.toLowerCase().includes(searchLower) ||
        (m.email?.toLowerCase().includes(searchLower) ?? false)
    )
  }, [members, debouncedSearch])

  // Sort members: available first, then unavailable
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aUnavailable = unavailableIds.has(a.id)
      const bUnavailable = unavailableIds.has(b.id)
      if (aUnavailable && !bUnavailable) return 1
      if (!aUnavailable && bUnavailable) return -1
      return 0
    })
  }, [filteredMembers, unavailableIds])

  const handleAssign = useCallback(async (leaderId: string | null) => {
    setIsAssigning(true)
    setError(null)

    const result = await updateAgendaItemLeader(agendaItemId, leaderId)

    if (result.error) {
      setError(result.error)
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
              <button
                type="button"
                onClick={() => handleAssign(null)}
                disabled={isAssigning}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  currentLeaderId === null
                    ? 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900'
                }`}
              >
                <span className="text-muted-foreground italic">Not assigned</span>
              </button>

              {sortedMembers.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {members.length === 0
                    ? 'No members in this ministry'
                    : 'No members found matching your search'}
                </p>
              ) : (
                sortedMembers.map((member) => {
                  const isUnavailable = unavailableIds.has(member.id)
                  const reason = unavailabilityReasons.get(member.id)

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => !isUnavailable && handleAssign(member.id)}
                      disabled={isAssigning || isUnavailable}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        isUnavailable
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 cursor-not-allowed opacity-75'
                          : currentLeaderId === member.id
                          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                          : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={isUnavailable ? 'text-red-700 dark:text-red-400' : ''}>
                          <div className="font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          {member.email && (
                            <div className={`text-sm ${isUnavailable ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'}`}>
                              {member.email}
                            </div>
                          )}
                        </div>
                        {isUnavailable && (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs">Unavailable</span>
                          </div>
                        )}
                      </div>
                      {isUnavailable && reason && (
                        <div className="text-xs text-red-600 dark:text-red-500 mt-1 italic">
                          {reason}
                        </div>
                      )}
                    </button>
                  )
                })
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
