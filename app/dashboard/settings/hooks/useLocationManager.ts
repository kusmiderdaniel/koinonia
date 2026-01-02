'use client'

import { useState, useCallback } from 'react'
import { createLocation, updateLocation, deleteLocation, getLocations } from '../actions'
import type { Location } from '../types'

interface UseLocationManagerReturn {
  // Dialog state
  locationDialogOpen: boolean
  editingLocation: Location | null
  locationName: string
  locationAddress: string
  locationNotes: string
  locationCampusId: string | null
  isSavingLocation: boolean
  deleteLocationDialogOpen: boolean
  locationToDelete: Location | null

  // Actions
  setLocationName: (name: string) => void
  setLocationAddress: (address: string) => void
  setLocationNotes: (notes: string) => void
  setLocationCampusId: (campusId: string | null) => void
  openLocationDialog: (location?: Location) => void
  closeLocationDialog: () => void
  openDeleteLocationDialog: (location: Location) => void
  closeDeleteLocationDialog: () => void
  handleSaveLocation: (
    locations: Location[],
    setLocations: (locations: Location[]) => void,
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void
  ) => Promise<void>
  handleDeleteLocation: (
    locations: Location[],
    setLocations: (locations: Location[]) => void,
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void
  ) => Promise<void>
}

export function useLocationManager(): UseLocationManagerReturn {
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationNotes, setLocationNotes] = useState('')
  const [locationCampusId, setLocationCampusId] = useState<string | null>(null)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [deleteLocationDialogOpen, setDeleteLocationDialogOpen] = useState(false)
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null)

  const openLocationDialog = useCallback((location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setLocationName(location.name)
      setLocationAddress(location.address || '')
      setLocationNotes(location.notes || '')
      setLocationCampusId(location.campus_id || null)
    } else {
      setEditingLocation(null)
      setLocationName('')
      setLocationAddress('')
      setLocationNotes('')
      setLocationCampusId(null)
    }
    setLocationDialogOpen(true)
  }, [])

  const closeLocationDialog = useCallback(() => {
    setLocationDialogOpen(false)
    setEditingLocation(null)
    setLocationName('')
    setLocationAddress('')
    setLocationNotes('')
    setLocationCampusId(null)
  }, [])

  const openDeleteLocationDialog = useCallback((location: Location) => {
    setLocationToDelete(location)
    setDeleteLocationDialogOpen(true)
  }, [])

  const closeDeleteLocationDialog = useCallback(() => {
    setDeleteLocationDialogOpen(false)
    setLocationToDelete(null)
  }, [])

  const handleSaveLocation = useCallback(
    async (
      locations: Location[],
      setLocations: (locations: Location[]) => void,
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void
    ) => {
      setIsSavingLocation(true)
      setError(null)

      const data = {
        name: locationName,
        address: locationAddress || undefined,
        notes: locationNotes || undefined,
        campusId: locationCampusId,
      }

      const result = editingLocation
        ? await updateLocation(editingLocation.id, data)
        : await createLocation(data)

      if (result.error) {
        setError(result.error)
      } else {
        // Reload locations
        const locationsResult = await getLocations()
        if (locationsResult.data) {
          setLocations(locationsResult.data)
        }
        setLocationDialogOpen(false)
        setSuccess(editingLocation ? 'Location updated!' : 'Location created!')
      }
      setIsSavingLocation(false)
    },
    [editingLocation, locationName, locationAddress, locationNotes, locationCampusId]
  )

  const handleDeleteLocation = useCallback(
    async (
      locations: Location[],
      setLocations: (locations: Location[]) => void,
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void
    ) => {
      if (!locationToDelete) return

      setError(null)
      const result = await deleteLocation(locationToDelete.id)

      if (result.error) {
        setError(result.error)
      } else {
        setLocations(locations.filter((l) => l.id !== locationToDelete.id))
        setSuccess('Location deleted!')
      }
      setDeleteLocationDialogOpen(false)
      setLocationToDelete(null)
    },
    [locationToDelete]
  )

  return {
    // Dialog state
    locationDialogOpen,
    editingLocation,
    locationName,
    locationAddress,
    locationNotes,
    locationCampusId,
    isSavingLocation,
    deleteLocationDialogOpen,
    locationToDelete,

    // Actions
    setLocationName,
    setLocationAddress,
    setLocationNotes,
    setLocationCampusId,
    openLocationDialog,
    closeLocationDialog,
    openDeleteLocationDialog,
    closeDeleteLocationDialog,
    handleSaveLocation,
    handleDeleteLocation,
  }
}
