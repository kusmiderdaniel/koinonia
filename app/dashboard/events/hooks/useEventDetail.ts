'use client'

import { useState, useMemo, useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import { DragEndEvent } from '@dnd-kit/core'
import {
  getEvent,
  reorderAgendaItems,
  updateAgendaItemSongKey,
  updateAgendaItemLeader,
  updateAgendaItemDuration,
  updateAgendaItemDescription,
} from '../actions'
import type { EventDetail, AgendaItem, Position } from '../types'

interface UseEventDetailReturn {
  // Data
  selectedEvent: EventDetail | null
  isLoadingDetail: boolean
  detailTab: string

  // Derived data
  sortedAgendaItems: AgendaItem[]
  totalDuration: number
  positionsByMinistry: Record<string, { ministry: Position['ministry']; positions: Position[] }>

  // Actions
  setDetailTab: (tab: string) => void
  loadEventDetail: (eventId: string) => Promise<void>
  closeEventDetail: () => void
  setSelectedEvent: React.Dispatch<React.SetStateAction<EventDetail | null>>

  // Agenda handlers
  handleDragEnd: (event: DragEndEvent) => Promise<void>
  handleAgendaItemKeyChange: (itemId: string, key: string | null) => Promise<{ error?: string }>
  handleAgendaItemLeaderChange: (itemId: string, leaderId: string | null) => Promise<{ error?: string }>
  handleAgendaItemDurationChange: (itemId: string, durationSeconds: number) => Promise<{ error?: string }>
  handleAgendaItemDescriptionChange: (itemId: string, description: string | null) => Promise<{ error?: string }>
}

export function useEventDetail(): UseEventDetailReturn {
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<string>('agenda')

  // Load event detail
  const loadEventDetail = useCallback(async (eventId: string) => {
    setIsLoadingDetail(true)
    const result = await getEvent(eventId)

    if (result.data) {
      setSelectedEvent(result.data as EventDetail)
    }
    setIsLoadingDetail(false)
  }, [])

  // Close event detail
  const closeEventDetail = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  // Sorted agenda items
  const sortedAgendaItems = useMemo(() => {
    return selectedEvent?.event_agenda_items?.slice().sort((a, b) => a.sort_order - b.sort_order) || []
  }, [selectedEvent?.event_agenda_items])

  // Total duration
  const totalDuration = useMemo(() => {
    return sortedAgendaItems.reduce((sum, item) => sum + item.duration_seconds, 0)
  }, [sortedAgendaItems])

  // Positions by ministry
  const positionsByMinistry = useMemo(() => {
    return selectedEvent?.event_positions.reduce((acc, position) => {
      const ministryId = position.ministry.id
      if (!acc[ministryId]) {
        acc[ministryId] = {
          ministry: position.ministry,
          positions: [],
        }
      }
      acc[ministryId].positions.push(position)
      return acc
    }, {} as Record<string, { ministry: Position['ministry']; positions: Position[] }>) || {}
  }, [selectedEvent?.event_positions])

  // Drag and drop handler
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!selectedEvent) return
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedAgendaItems.findIndex((item) => item.id === active.id)
      const newIndex = sortedAgendaItems.findIndex((item) => item.id === over.id)

      const newOrder = arrayMove(sortedAgendaItems, oldIndex, newIndex)
      const newIds = newOrder.map((item) => item.id)

      // Optimistically update the UI
      const reorderedItems = newOrder.map((item, idx) => ({
        ...item,
        sort_order: idx,
      }))
      setSelectedEvent({
        ...selectedEvent,
        event_agenda_items: reorderedItems,
      })

      // Save to server
      await reorderAgendaItems(selectedEvent.id, newIds)
    }
  }, [selectedEvent, sortedAgendaItems])

  // Agenda item handlers
  const handleAgendaItemKeyChange = useCallback(async (itemId: string, key: string | null) => {
    const result = await updateAgendaItemSongKey(itemId, key)
    if (!result.error && selectedEvent) {
      await loadEventDetail(selectedEvent.id)
    }
    return result
  }, [selectedEvent, loadEventDetail])

  const handleAgendaItemLeaderChange = useCallback(async (itemId: string, leaderId: string | null) => {
    const result = await updateAgendaItemLeader(itemId, leaderId)
    if (!result.error && selectedEvent) {
      await loadEventDetail(selectedEvent.id)
    }
    return result
  }, [selectedEvent, loadEventDetail])

  const handleAgendaItemDurationChange = useCallback(async (itemId: string, durationSeconds: number) => {
    const result = await updateAgendaItemDuration(itemId, durationSeconds)
    if (!result.error && selectedEvent) {
      await loadEventDetail(selectedEvent.id)
    }
    return result
  }, [selectedEvent, loadEventDetail])

  const handleAgendaItemDescriptionChange = useCallback(async (itemId: string, description: string | null) => {
    const result = await updateAgendaItemDescription(itemId, description)
    if (!result.error && selectedEvent) {
      await loadEventDetail(selectedEvent.id)
    }
    return result
  }, [selectedEvent, loadEventDetail])

  return {
    // Data
    selectedEvent,
    isLoadingDetail,
    detailTab,

    // Derived data
    sortedAgendaItems,
    totalDuration,
    positionsByMinistry,

    // Actions
    setDetailTab,
    loadEventDetail,
    closeEventDetail,
    setSelectedEvent,

    // Agenda handlers
    handleDragEnd,
    handleAgendaItemKeyChange,
    handleAgendaItemLeaderChange,
    handleAgendaItemDurationChange,
    handleAgendaItemDescriptionChange,
  }
}
