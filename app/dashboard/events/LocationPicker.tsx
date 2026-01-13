'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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
import { CampusBadge } from '@/components/CampusBadge'
import { getLocations, createLocation } from '../settings/actions'

interface Location {
  id: string
  name: string
  address: string | null
  notes: string | null
  campus_id?: string | null
  campus?: {
    id: string
    name: string
    color: string
  } | null
}

interface LocationPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLocationId: string | null
  onSelect: (location: Location | null) => void
  filterByCampusIds?: string[]
}

export function LocationPicker({
  open,
  onOpenChange,
  selectedLocationId,
  onSelect,
  filterByCampusIds = [],
}: LocationPickerProps) {
  const t = useTranslations('events.location')
  const tActions = useTranslations('events.actions')
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
    let filtered = locations

    // Filter by campus: show locations that match selected campus(es) OR have no campus (church-wide)
    if (filterByCampusIds.length > 0) {
      filtered = filtered.filter(
        (l) => !l.campus_id || filterByCampusIds.includes(l.campus_id)
      )
    }

    // Filter by search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(searchLower) ||
          l.address?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [locations, debouncedSearch, filterByCampusIds])

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
      campusIds: filterByCampusIds.length > 0 ? filterByCampusIds : [],
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
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{showNewForm ? t('newLocation') : t('chooseLocation')}</DialogTitle>
          <DialogDescription>
            {showNewForm
              ? t('createDescription')
              : t('selectDescription')}
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
              <Label htmlFor="newLocationName">{t('nameRequired')}</Label>
              <Input
                id="newLocationName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('namePlaceholder')}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLocationAddress">{t('addressLabel')}</Label>
              <Input
                id="newLocationAddress"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder={t('addressPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLocationNotes">{t('notesLabel')}</Label>
              <Input
                id="newLocationNotes"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
              />
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-4 !bg-transparent !border-0 !mx-0 !mb-0 !p-0">
              <Button
                type="button"
                variant="outline-pill"
                className="!border !border-black dark:!border-white"
                onClick={() => {
                  setShowNewForm(false)
                  setNewName('')
                  setNewAddress('')
                  setNewNotes('')
                }}
                disabled={isCreating}
              >
                {tActions('back')}
              </Button>
              <Button
                type="button"
                variant="outline-pill"
                onClick={handleCreateLocation}
                disabled={isCreating || !newName.trim()}
                className="!border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
              >
                {isCreating ? t('creating') : t('createAndSelect')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Location List */}
            <div className="max-h-[300px] overflow-y-auto -mx-4 px-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('loading')}
                </p>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-6">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {locations.length === 0
                      ? t('noLocations')
                      : t('noLocationsFound')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLocations.map((location) => {
                    const isSelected = location.id === selectedLocationId
                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleSelect(location)}
                        className={`w-full text-left p-3 rounded-lg transition-all border ${
                          isSelected
                            ? 'border-black dark:border-white bg-gray-100 dark:bg-zinc-800 font-medium'
                            : 'border-gray-300 dark:border-zinc-700 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={isSelected ? 'font-medium' : ''}>{location.name}</span>
                                {location.campus && (
                                  <CampusBadge name={location.campus.name} color={location.campus.color} size="sm" />
                                )}
                              </div>
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
                className="rounded-full !border !border-black dark:!border-white"
                onClick={() => setShowNewForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('newLocation')}
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
                    {tActions('clear')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => onOpenChange(false)}
                >
                  {tActions('close')}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
