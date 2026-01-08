import { MUSICAL_KEYS } from '@/lib/constants/event'
import type { AgendaItem, Member } from '../../types'

export type { AgendaItem, Member }

export const MAJOR_KEYS = MUSICAL_KEYS.filter(k => !k.endsWith('m'))
export const MINOR_KEYS = MUSICAL_KEYS.filter(k => k.endsWith('m'))

export interface SortableAgendaItemProps {
  item: AgendaItem
  index: number
  totalItems: number
  canManage: boolean
  formatDuration: (seconds: number) => string
  onEdit: (item: AgendaItem) => void
  onDelete: (item: AgendaItem) => void
  onKeyChange: (itemId: string, key: string | null) => Promise<void>
  onLeaderChange: (itemId: string, leaderId: string | null) => Promise<void>
  onDurationChange: (itemId: string, durationSeconds: number) => Promise<void>
  onDescriptionChange: (itemId: string, description: string | null) => Promise<void>
  onArrangementChange: (itemId: string, arrangementId: string | null) => Promise<void>
  onSongPlaceholderClick: (item: AgendaItem) => void
  onSongClick: (item: AgendaItem) => void
  onMoveUp?: (itemId: string) => void
  onMoveDown?: (itemId: string) => void
}

export interface PopoverState {
  keyPopoverOpen: boolean
  leaderPopoverOpen: boolean
  durationPopoverOpen: boolean
  descriptionPopoverOpen: boolean
}

export interface EditState {
  editMinutes: string
  editSeconds: string
  editDescription: string
}
