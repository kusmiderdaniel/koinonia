'use client'

import { useState, useCallback } from 'react'
import type { Unavailability } from '../types'

interface UseAvailabilityDialogsReturn {
  // Add dialog state
  addDialogOpen: boolean
  reason: string

  // Edit dialog state
  editDialogOpen: boolean
  editingId: string | null
  editStartDate: string
  editEndDate: string
  editReason: string

  // Tabs state
  activeTab: string

  // Actions
  setAddDialogOpen: (open: boolean) => void
  setEditDialogOpen: (open: boolean) => void
  setReason: (reason: string) => void
  setActiveTab: (tab: string) => void
  openAddDialog: () => void
  closeAddDialog: () => void
  openEditDialog: (item: Unavailability) => void
  closeEditDialog: () => void
  setEditStartDate: (date: string) => void
  setEditEndDate: (date: string) => void
  setEditReason: (reason: string) => void
}

export function useAvailabilityDialogs(): UseAvailabilityDialogsReturn {
  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [reason, setReason] = useState('')

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editReason, setEditReason] = useState('')

  // Tabs state
  const [activeTab, setActiveTab] = useState('upcoming')

  const openAddDialog = useCallback(() => {
    setAddDialogOpen(true)
  }, [])

  const closeAddDialog = useCallback(() => {
    setAddDialogOpen(false)
    setReason('')
  }, [])

  const openEditDialog = useCallback((item: Unavailability) => {
    setEditingId(item.id)
    setEditStartDate(item.start_date)
    setEditEndDate(item.end_date)
    setEditReason(item.reason || '')
    setEditDialogOpen(true)
  }, [])

  const closeEditDialog = useCallback(() => {
    setEditDialogOpen(false)
    setEditingId(null)
    setEditStartDate('')
    setEditEndDate('')
    setEditReason('')
  }, [])

  return {
    // Add dialog state
    addDialogOpen,
    reason,

    // Edit dialog state
    editDialogOpen,
    editingId,
    editStartDate,
    editEndDate,
    editReason,

    // Tabs state
    activeTab,

    // Actions
    setAddDialogOpen,
    setEditDialogOpen,
    setReason,
    setActiveTab,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    setEditStartDate,
    setEditEndDate,
    setEditReason,
  }
}
