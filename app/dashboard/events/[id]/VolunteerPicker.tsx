'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, AlertTriangle } from 'lucide-react'
import { SmartVirtualizedList } from '@/components/VirtualizedList'
import { getEligibleVolunteers, assignVolunteer } from '../actions'

interface Role {
  id: string
  name: string
}

interface Volunteer {
  id: string
  first_name: string
  last_name: string
  email: string | null
  roles: Role[]
  isUnavailable: boolean
  unavailableReason: string | null
  isAlreadyAssigned: boolean
  assignedPositions: string[]
}

interface Position {
  id: string
  title: string
  quantity_needed: number
  role: {
    id: string
    name: string
  } | null
  event_assignments: { id: string }[]
}

interface VolunteerPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: Position
  onSuccess: () => void
}

export function VolunteerPicker({
  open,
  onOpenChange,
  position,
  onSuccess,
}: VolunteerPickerProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setSearch('')
      setError(null)

      getEligibleVolunteers(position.id).then((result) => {
        if (result.error) {
          setError(result.error)
        } else {
          setVolunteers(result.data || [])
        }
        setIsLoading(false)
      })
    }
  }, [open, position.id])

  const filteredVolunteers = useMemo(() => {
    if (!debouncedSearch.trim()) return volunteers

    const searchLower = debouncedSearch.toLowerCase()
    return volunteers.filter(
      (v) =>
        v.first_name.toLowerCase().includes(searchLower) ||
        v.last_name.toLowerCase().includes(searchLower) ||
        (v.email?.toLowerCase().includes(searchLower) ?? false)
    )
  }, [volunteers, debouncedSearch])

  const handleAssign = useCallback(async (volunteerId: string) => {
    setIsAssigning(true)
    setError(null)

    const result = await assignVolunteer(position.id, volunteerId)

    if (result.error) {
      setError(result.error)
      setIsAssigning(false)
    } else {
      setIsAssigning(false)
      onSuccess()
    }
  }, [position.id, onSuccess])

  const remainingSlots = position.quantity_needed - position.event_assignments.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Assign Volunteer</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {position.title}
            {position.role && position.role.name !== position.title && (
              <Badge variant="outline" className="ml-2 text-xs">
                {position.role.name}
              </Badge>
            )}
            <span className="ml-2">({remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining)</span>
          </div>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
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
            autoFocus={false}
          />
        </div>

        {/* Volunteer List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading volunteers...
          </p>
        ) : (
          <SmartVirtualizedList
            items={filteredVolunteers}
            estimateSize={100}
            className="max-h-[350px] -mx-4 px-4"
            virtualizationThreshold={50}
            emptyMessage={
              <p className="text-sm text-muted-foreground text-center py-4">
                {volunteers.length === 0
                  ? 'No eligible volunteers found in this ministry'
                  : 'No volunteers found matching your search'}
              </p>
            }
            renderItem={(volunteer) => (
              <button
                key={volunteer.id}
                type="button"
                onClick={() => !volunteer.isUnavailable && handleAssign(volunteer.id)}
                disabled={isAssigning || volunteer.isUnavailable}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  volunteer.isUnavailable
                    ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900 opacity-60 cursor-not-allowed'
                    : volunteer.isAlreadyAssigned
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {volunteer.first_name} {volunteer.last_name}
                      </span>
                      {volunteer.isUnavailable && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Unavailable
                        </Badge>
                      )}
                      {volunteer.isAlreadyAssigned && (
                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Already assigned
                        </Badge>
                      )}
                    </div>
                    {volunteer.email && (
                      <div className="text-sm text-muted-foreground">
                        {volunteer.email}
                      </div>
                    )}
                    {volunteer.isUnavailable && volunteer.unavailableReason && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Reason: {volunteer.unavailableReason}
                      </div>
                    )}
                    {volunteer.isAlreadyAssigned && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Assigned to: {volunteer.assignedPositions.join(', ')}
                      </div>
                    )}
                    {volunteer.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {volunteer.roles.map((role) => (
                          <Badge
                            key={role.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )}
          />
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="outline-pill" className="!border !border-black dark:!border-white" onClick={() => onOpenChange(false)} disabled={isAssigning}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
