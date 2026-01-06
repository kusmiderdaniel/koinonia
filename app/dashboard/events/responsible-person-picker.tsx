'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, User } from 'lucide-react'
import { getChurchMembers } from './actions'
import type { Person } from './types'

interface ResponsiblePersonPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPersonId: string | null
  onSelect: (person: Person | null) => void
}

export function ResponsiblePersonPicker({
  open,
  onOpenChange,
  selectedPersonId,
  onSelect,
}: ResponsiblePersonPickerProps) {
  const [members, setMembers] = useState<Person[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setSearch('')
      setError(null)

      getChurchMembers().then((result) => {
        if (result.error) {
          setError(result.error)
        } else {
          setMembers((result.data as Person[]) || [])
        }
        setIsLoading(false)
      })
    }
  }, [open])

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

  const handleSelect = (person: Person) => {
    onSelect(person)
    onOpenChange(false)
  }

  const handleClearSelection = () => {
    onSelect(null)
    onOpenChange(false)
  }

  const selectedPerson = members.find((m) => m.id === selectedPersonId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Choose Responsible Person</DialogTitle>
          <DialogDescription>
            Select the person responsible for this event
          </DialogDescription>
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
          />
        </div>

        {/* Member List */}
        <div className="max-h-[300px] overflow-y-auto -mx-4 px-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading members...
            </p>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-6">
              <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {members.length === 0
                  ? 'No members available'
                  : 'No members found'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMembers.map((person) => {
                const isSelected = person.id === selectedPersonId
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleSelect(person)}
                    className={`w-full text-left p-3 rounded-lg transition-all border border-black dark:border-white ${
                      isSelected
                        ? 'bg-gray-100 dark:bg-zinc-800 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className={isSelected ? 'font-medium' : ''}>
                          {person.first_name} {person.last_name}
                        </div>
                        {person.email && (
                          <div className="text-sm text-muted-foreground">
                            {person.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t">
          {selectedPerson && (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={handleClearSelection}
            >
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
