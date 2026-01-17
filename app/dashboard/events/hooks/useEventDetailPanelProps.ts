import { useMemo } from 'react'
import type { useSensors } from '@dnd-kit/core'
import { formatDuration } from '@/lib/utils/format'
import type { EventDetail, AgendaItem, Position, Assignment, Member } from '../types'
import type { EventDetailPanelProps } from '../components/detail/types'

interface UseEventDetailPanelPropsOptions {
  // Event detail state
  selectedEvent: EventDetail | null
  sortedAgendaItems: AgendaItem[]
  totalDuration: number
  positionsByMinistry: Record<string, { ministry: Position['ministry']; positions: Position[] }>
  detailTab: string
  setDetailTab: (tab: string) => void
  closeEventDetail: () => void
  handleDragEnd: EventDetailPanelProps['onDragEnd']

  // Permissions
  canManage: boolean
  canManageContent: boolean
  canDelete: boolean

  // DnD
  sensors: ReturnType<typeof useSensors>

  // Dialog openers
  openEditDialog: (event: EventDetail) => void
  openDeleteDialog: (event: EventDetail) => void
  setAgendaPickerOpen: (open: boolean) => void
  setSongPickerOpen: (open: boolean) => void
  closeSongPicker: () => void
  openDeleteAgendaItemDialog: (item: AgendaItem) => void
  setPositionPickerOpen: (open: boolean) => void
  openDeletePositionDialog: (position: Position) => void
  openVolunteerPicker: (position: Position) => void
  openUnassignDialog: (assignment: Assignment, positionTitle: string) => void
  setSendInvitationsDialogOpen: (open: boolean) => void

  // Handlers
  handleEditAgendaItem: (item: AgendaItem) => void
  handleAgendaKeyChange: (itemId: string, key: string | null) => Promise<void>
  handleAgendaLeaderChange: (itemId: string, leaderId: string | null) => Promise<void>
  handleAgendaDurationChange: (itemId: string, durationSeconds: number) => Promise<void>
  handleAgendaDescriptionChange: (itemId: string, description: string | null) => Promise<void>
  handleAgendaArrangementChange: (itemId: string, arrangementId: string | null) => Promise<void>
  handleSongPlaceholderClick: (item: AgendaItem) => void
  handleSongClick: (item: AgendaItem) => void
  handleMoveAgendaItemUp: (itemId: string) => void
  handleMoveAgendaItemDown: (itemId: string) => void
  handleAddTask: () => void
  taskRefreshKey: number

  // Task-related data
  taskMembers: Member[]
  taskMinistries: { id: string; name: string; color: string; campus_id: string | null }[]
  taskCampuses: { id: string; name: string; color: string }[]
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6

  // Time format preference
  timeFormat?: '12h' | '24h'
}

export function useEventDetailPanelProps(
  options: UseEventDetailPanelPropsOptions
): EventDetailPanelProps | null {
  const {
    selectedEvent,
    sortedAgendaItems,
    totalDuration,
    positionsByMinistry,
    detailTab,
    setDetailTab,
    closeEventDetail,
    handleDragEnd,
    canManage,
    canManageContent,
    canDelete,
    sensors,
    openEditDialog,
    openDeleteDialog,
    setAgendaPickerOpen,
    setSongPickerOpen,
    closeSongPicker,
    openDeleteAgendaItemDialog,
    setPositionPickerOpen,
    openDeletePositionDialog,
    openVolunteerPicker,
    openUnassignDialog,
    setSendInvitationsDialogOpen,
    handleEditAgendaItem,
    handleAgendaKeyChange,
    handleAgendaLeaderChange,
    handleAgendaDurationChange,
    handleAgendaDescriptionChange,
    handleAgendaArrangementChange,
    handleSongPlaceholderClick,
    handleSongClick,
    handleMoveAgendaItemUp,
    handleMoveAgendaItemDown,
    handleAddTask,
    taskRefreshKey,
    taskMembers,
    taskMinistries,
    taskCampuses,
    weekStartsOn,
    timeFormat,
  } = options

  return useMemo(() => {
    if (!selectedEvent) return null

    return {
      selectedEvent,
      sortedAgendaItems,
      totalDuration,
      positionsByMinistry,
      detailTab,
      setDetailTab,
      canManage,
      canManageContent,
      canDelete,
      timeFormat,
      sensors,
      formatDuration,
      onClose: closeEventDetail,
      onEdit: () => openEditDialog(selectedEvent),
      onDelete: () => openDeleteDialog(selectedEvent),
      onDragEnd: handleDragEnd,
      onAddAgendaItem: () => setAgendaPickerOpen(true),
      onAddSong: () => {
        closeSongPicker()
        setSongPickerOpen(true)
      },
      onEditAgendaItem: handleEditAgendaItem,
      onDeleteAgendaItem: (item) => openDeleteAgendaItemDialog(item),
      onAgendaKeyChange: handleAgendaKeyChange,
      onAgendaLeaderChange: handleAgendaLeaderChange,
      onAgendaDurationChange: handleAgendaDurationChange,
      onAgendaDescriptionChange: handleAgendaDescriptionChange,
      onAgendaArrangementChange: handleAgendaArrangementChange,
      onSongPlaceholderClick: handleSongPlaceholderClick,
      onSongClick: handleSongClick,
      onMoveAgendaItemUp: handleMoveAgendaItemUp,
      onMoveAgendaItemDown: handleMoveAgendaItemDown,
      onAddPosition: () => setPositionPickerOpen(true),
      onDeletePosition: (position) => openDeletePositionDialog(position),
      onAssignVolunteer: (position) => openVolunteerPicker(position),
      onUnassign: (assignment, positionTitle) => openUnassignDialog(assignment, positionTitle),
      onSendInvitations: () => setSendInvitationsDialogOpen(true),
      onAddTask: handleAddTask,
      taskRefreshKey,
      taskMembers,
      taskMinistries,
      taskCampuses,
      weekStartsOn,
      initialTasks: selectedEvent.tasks,
    }
  }, [
    selectedEvent,
    sortedAgendaItems,
    totalDuration,
    positionsByMinistry,
    detailTab,
    setDetailTab,
    canManage,
    canManageContent,
    canDelete,
    timeFormat,
    sensors,
    closeEventDetail,
    openEditDialog,
    openDeleteDialog,
    handleDragEnd,
    setAgendaPickerOpen,
    setSongPickerOpen,
    closeSongPicker,
    handleEditAgendaItem,
    openDeleteAgendaItemDialog,
    handleAgendaKeyChange,
    handleAgendaLeaderChange,
    handleAgendaDurationChange,
    handleAgendaDescriptionChange,
    handleAgendaArrangementChange,
    handleSongPlaceholderClick,
    handleSongClick,
    handleMoveAgendaItemUp,
    handleMoveAgendaItemDown,
    setPositionPickerOpen,
    openDeletePositionDialog,
    openVolunteerPicker,
    openUnassignDialog,
    setSendInvitationsDialogOpen,
    handleAddTask,
    taskRefreshKey,
    taskMembers,
    taskMinistries,
    taskCampuses,
    weekStartsOn,
  ])
}
