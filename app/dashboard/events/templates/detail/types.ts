export interface Location {
  id: string
  name: string
  address: string | null
}

export interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  is_song_placeholder: boolean
  ministry_id: string | null
  ministry: { id: string; name: string } | null
  sort_order: number
}

export interface Position {
  id: string
  ministry_id: string
  role_id: string | null
  title: string
  quantity_needed: number
  notes: string | null
  ministry: { id: string; name: string; color: string } | null
  role: { id: string; name: string } | null
  sort_order: number | null
}

export interface Template {
  id: string
  name: string
  description: string | null
  event_type: string
  location_id: string | null
  location: Location | null
  default_start_time: string
  default_duration_minutes: number
  visibility: string
  event_template_agenda_items: AgendaItem[]
  event_template_positions: Position[]
}

export interface TemplateDetailPanelProps {
  template: Template
  canManage: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onTemplateUpdated: () => void
}

export interface TemplateHeaderProps {
  template: Template
  canManage: boolean
  canDelete: boolean
  isDuplicating: boolean
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onDuplicate: () => void
  onCreateEvent: () => void
}

export interface TemplateAgendaSectionProps {
  agendaItems: AgendaItem[]
  canManage: boolean
  sensors: ReturnType<typeof import('@dnd-kit/core').useSensors>
  onDragEnd: (event: import('@dnd-kit/core').DragEndEvent) => Promise<void>
  onAddItem: (isSongPlaceholder?: boolean) => void
  onEditItem: (item: AgendaItem) => void
  onRemoveItem: (itemId: string) => void
}

export interface TemplatePositionsSectionProps {
  positions: Position[]
  canManage: boolean
  onAddPosition: () => void
  onRemovePosition: (positionId: string) => void
  onUpdateQuantity: (positionId: string, quantity: number) => void
}
