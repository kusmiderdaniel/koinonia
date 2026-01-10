'use client'

import { useState, useCallback } from 'react'
import { createCampus, updateCampus, deleteCampus, getCampuses, setDefaultCampus } from '../actions'
import type { Campus } from '../actions'

export interface CampusManagerTranslations {
  createdSuccess: string
  updatedSuccess: string
  deletedSuccess: string
  defaultUpdatedSuccess: string
}

interface UseCampusManagerReturn {
  // Dialog state
  campusDialogOpen: boolean
  editingCampus: Campus | null
  campusName: string
  campusDescription: string
  campusAddress: string
  campusCity: string
  campusState: string
  campusZipCode: string
  campusCountry: string
  campusColor: string
  campusIsDefault: boolean
  isSavingCampus: boolean
  deleteCampusDialogOpen: boolean
  campusToDelete: Campus | null

  // Actions
  setCampusName: (name: string) => void
  setCampusDescription: (description: string) => void
  setCampusAddress: (address: string) => void
  setCampusCity: (city: string) => void
  setCampusState: (state: string) => void
  setCampusZipCode: (zipCode: string) => void
  setCampusCountry: (country: string) => void
  setCampusColor: (color: string) => void
  setCampusIsDefault: (isDefault: boolean) => void
  openCampusDialog: (campus?: Campus) => void
  closeCampusDialog: () => void
  openDeleteCampusDialog: (campus: Campus) => void
  closeDeleteCampusDialog: () => void
  handleSaveCampus: (
    campuses: Campus[],
    setCampuses: (campuses: Campus[]) => void,
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void
  ) => Promise<void>
  handleDeleteCampus: (
    campuses: Campus[],
    setCampuses: (campuses: Campus[]) => void,
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void
  ) => Promise<void>
  handleSetDefault: (
    campusId: string,
    setCampuses: (campuses: Campus[]) => void,
    setError: (error: string | null) => void,
    setSuccess: (success: string | null) => void
  ) => Promise<void>
}

const DEFAULT_COLOR = '#3B82F6'

export function useCampusManager(translations: CampusManagerTranslations): UseCampusManagerReturn {
  const [campusDialogOpen, setCampusDialogOpen] = useState(false)
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null)
  const [campusName, setCampusName] = useState('')
  const [campusDescription, setCampusDescription] = useState('')
  const [campusAddress, setCampusAddress] = useState('')
  const [campusCity, setCampusCity] = useState('')
  const [campusState, setCampusState] = useState('')
  const [campusZipCode, setCampusZipCode] = useState('')
  const [campusCountry, setCampusCountry] = useState('')
  const [campusColor, setCampusColor] = useState(DEFAULT_COLOR)
  const [campusIsDefault, setCampusIsDefault] = useState(false)
  const [isSavingCampus, setIsSavingCampus] = useState(false)
  const [deleteCampusDialogOpen, setDeleteCampusDialogOpen] = useState(false)
  const [campusToDelete, setCampusToDelete] = useState<Campus | null>(null)

  const openCampusDialog = useCallback((campus?: Campus) => {
    if (campus) {
      setEditingCampus(campus)
      setCampusName(campus.name)
      setCampusDescription(campus.description || '')
      setCampusAddress(campus.address || '')
      setCampusCity(campus.city || '')
      setCampusState(campus.state || '')
      setCampusZipCode(campus.zip_code || '')
      setCampusCountry(campus.country || '')
      setCampusColor(campus.color || DEFAULT_COLOR)
      setCampusIsDefault(campus.is_default)
    } else {
      setEditingCampus(null)
      setCampusName('')
      setCampusDescription('')
      setCampusAddress('')
      setCampusCity('')
      setCampusState('')
      setCampusZipCode('')
      setCampusCountry('')
      setCampusColor(DEFAULT_COLOR)
      setCampusIsDefault(false)
    }
    setCampusDialogOpen(true)
  }, [])

  const closeCampusDialog = useCallback(() => {
    setCampusDialogOpen(false)
    setEditingCampus(null)
    setCampusName('')
    setCampusDescription('')
    setCampusAddress('')
    setCampusCity('')
    setCampusState('')
    setCampusZipCode('')
    setCampusCountry('')
    setCampusColor(DEFAULT_COLOR)
    setCampusIsDefault(false)
  }, [])

  const openDeleteCampusDialog = useCallback((campus: Campus) => {
    setCampusToDelete(campus)
    setDeleteCampusDialogOpen(true)
  }, [])

  const closeDeleteCampusDialog = useCallback(() => {
    setDeleteCampusDialogOpen(false)
    setCampusToDelete(null)
  }, [])

  const handleSaveCampus = useCallback(
    async (
      campuses: Campus[],
      setCampuses: (campuses: Campus[]) => void,
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void
    ) => {
      setIsSavingCampus(true)
      setError(null)

      const data = {
        name: campusName,
        description: campusDescription || undefined,
        address: campusAddress || undefined,
        city: campusCity || undefined,
        state: campusState || undefined,
        zipCode: campusZipCode || undefined,
        country: campusCountry || undefined,
        color: campusColor || DEFAULT_COLOR,
        isDefault: campusIsDefault,
      }

      const result = editingCampus
        ? await updateCampus(editingCampus.id, data)
        : await createCampus(data)

      if (result.error) {
        setError(result.error)
      } else {
        // Reload campuses
        const campusesResult = await getCampuses()
        if (campusesResult.data) {
          setCampuses(campusesResult.data)
        }
        setCampusDialogOpen(false)
        setSuccess(editingCampus ? translations.updatedSuccess : translations.createdSuccess)
        closeCampusDialog()
      }
      setIsSavingCampus(false)
    },
    [editingCampus, campusName, campusDescription, campusAddress, campusCity, campusState, campusZipCode, campusCountry, campusColor, campusIsDefault, closeCampusDialog, translations.createdSuccess, translations.updatedSuccess]
  )

  const handleDeleteCampus = useCallback(
    async (
      campuses: Campus[],
      setCampuses: (campuses: Campus[]) => void,
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void
    ) => {
      if (!campusToDelete) return

      setError(null)
      const result = await deleteCampus(campusToDelete.id)

      if (result.error) {
        setError(result.error)
      } else {
        setCampuses(campuses.filter((c) => c.id !== campusToDelete.id))
        setSuccess(translations.deletedSuccess)
      }
      setDeleteCampusDialogOpen(false)
      setCampusToDelete(null)
    },
    [campusToDelete, translations.deletedSuccess]
  )

  const handleSetDefault = useCallback(
    async (
      campusId: string,
      setCampuses: (campuses: Campus[]) => void,
      setError: (error: string | null) => void,
      setSuccess: (success: string | null) => void
    ) => {
      setError(null)
      const result = await setDefaultCampus(campusId)

      if (result.error) {
        setError(result.error)
      } else {
        // Reload campuses to get updated default status
        const campusesResult = await getCampuses()
        if (campusesResult.data) {
          setCampuses(campusesResult.data)
        }
        setSuccess(translations.defaultUpdatedSuccess)
      }
    },
    [translations.defaultUpdatedSuccess]
  )

  return {
    // Dialog state
    campusDialogOpen,
    editingCampus,
    campusName,
    campusDescription,
    campusAddress,
    campusCity,
    campusState,
    campusZipCode,
    campusCountry,
    campusColor,
    campusIsDefault,
    isSavingCampus,
    deleteCampusDialogOpen,
    campusToDelete,

    // Actions
    setCampusName,
    setCampusDescription,
    setCampusAddress,
    setCampusCity,
    setCampusState,
    setCampusZipCode,
    setCampusCountry,
    setCampusColor,
    setCampusIsDefault,
    openCampusDialog,
    closeCampusDialog,
    openDeleteCampusDialog,
    closeDeleteCampusDialog,
    handleSaveCampus,
    handleDeleteCampus,
    handleSetDefault,
  }
}
