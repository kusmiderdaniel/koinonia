'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, MapPin, Plus } from 'lucide-react'
import { getLocations, createLocation } from '../settings/actions'

interface Location {
  id: string
  name: string
  address: string | null
  notes: string | null
}

interface LocationPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLocationId: string | null
  onSelect: (location: Location | null) => void
}

export function LocationPicker({
  open,
  onOpenChange,
  selectedLocationId,
  onSelect,
}: LocationPickerProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New location form
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setSearch('')
      setError(null)
      setShowNewForm(false)

      getLocations().then((result) => {
        if (result.error) {
          setError(result.error)
        } else {
          setLocations(result.data || [])
        }
        setIsLoading(false)
      })
    }
  }, [open])

  const filteredLocations = useMemo(() => {
    if (!debouncedSearch.trim()) return locations

    const searchLower = debouncedSearch.toLowerCase()
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(searchLower) ||
        l.address?.toLowerCase().includes(searchLower)
    )
  }, [locations, debouncedSearch])

  const handleSelect = (location: Location) => {
    onSelect(location)
    onOpenChange(false)
  }

  const handleClearSelection = () => {
    onSelect(null)
    onOpenChange(false)
  }

  const handleCreateLocation = async () => {
    if (!newName.trim()) return

    setIsCreating(true)
    setError(null)

    const result = await createLocation({
      name: newName,
      address: newAddress || undefined,
      notes: newNotes || undefined,
    })

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      // Add the new location and select it
      setLocations([...locations, result.data])
      onSelect(result.data)
      onOpenChange(false)
    }
    setIsCreating(false)
  }

  const selectedLocation = locations.find((l) => l.id === selectedLocationId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>{showNewForm ? 'New Location' : 'Choose Location'}</DialogTitle>
          <DialogDescription>
            {showNewForm
              ? 'Create a new location for this event and to use it in the future.'
              : 'Select a location for this event or create a new one'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {showNewForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newLocationName">Location Name *</Label>
              <Input
                id="newLocationName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Main Sanctuary"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLocationAddress">Address</Label>
              <Input
                id="newLocationAddress"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g., 123 Church Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLocationNotes">Notes</Label>
              <Input
                id="newLocationNotes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g., Enter through side door"
              />
            </div>
            <DialogFooter className="gap-3 border-0 bg-transparent">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setShowNewForm(false)
                  setNewName('')
                  setNewAddress('')
                  setNewNotes('')
                }}
                disabled={isCreating}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateLocation}
                disabled={isCreating || !newName.trim()}
                className="rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                {isCreating ? 'Creating...' : 'Create & Select'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Location List */}
            <div className="max-h-[300px] overflow-y-auto -mx-4 px-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Loading locations...
                </p>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {locations.length === 0
                      ? 'No locations yet'
                      : 'No locations found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLocations.map((location) => {
                    const isSelected = location.id === selectedLocationId
                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleSelect(location)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-gray-100 dark:bg-zinc-800 font-medium'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div className={isSelected ? 'font-medium' : ''}>{location.name}</div>
                              {location.address && (
                                <div className="text-sm text-muted-foreground">
                                  {location.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Location
              </Button>
              <div className="flex gap-2">
                {selectedLocation && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={handleClearSelection}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
