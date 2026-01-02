'use client'

import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Clock,
  MapPin,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Music,
  Users,
  X,
  CalendarPlus,
  Copy,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  removeTemplateAgendaItem,
  reorderTemplateAgendaItems,
  removeTemplatePosition,
  updateTemplatePosition,
  duplicateEventTemplate,
} from './actions'
import { toast } from 'sonner'
import { TemplateAgendaItemDialog } from './TemplateAgendaItemDialog'
import { TemplatePositionPicker } from './TemplatePositionPicker'
import { CreateEventFromTemplateDialog } from './CreateEventFromTemplateDialog'
import { SortableTemplateAgendaItem } from './SortableTemplateAgendaItem'
import { EventTypeBadge } from '@/components/EventTypeBadge'
import { VisibilityBadge } from '@/components/VisibilityBadge'
import { formatTimeString, formatDurationMinutes } from '@/lib/utils/format'

interface Location {
  id: string
  name: string
  address: string | null
}

interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  is_song_placeholder: boolean
  ministry_id: string | null
  ministry: { id: string; name: string } | null
  sort_order: number
}

interface Position {
  id: string
  ministry_id: string
  role_id: string | null
  title: string
  quantity_needed: number
  notes: string | null
  ministry: { id: string; name: string } | null
  role: { id: string; name: string } | null
  sort_order: number | null
}

interface Template {
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

interface TemplateDetailPanelProps {
  template: Template
  canManage: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  onTemplateUpdated: () => void
}

export const TemplateDetailPanel = memo(function TemplateDetailPanel({
  template,
  canManage,
  canDelete,
  onEdit,
  onDelete,
  onClose,
  onTemplateUpdated,
}: TemplateDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('agenda')
  const [agendaItemDialogOpen, setAgendaItemDialogOpen] = useState(false)
  const [editingAgendaItem, setEditingAgendaItem] = useState<AgendaItem | null>(null)
  const [positionPickerOpen, setPositionPickerOpen] = useState(false)
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    const result = await duplicateEventTemplate(template.id)
    setIsDuplicating(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Template duplicated as "${template.name} - copy"`)
      onTemplateUpdated()
    }
  }

  const handleAddAgendaItem = (isSongPlaceholder: boolean = false) => {
    setEditingAgendaItem(isSongPlaceholder ? ({ is_song_placeholder: true } as AgendaItem) : null)
    setAgendaItemDialogOpen(true)
  }

  const handleEditAgendaItem = (item: AgendaItem) => {
    setEditingAgendaItem(item)
    setAgendaItemDialogOpen(true)
  }

  const handleRemoveAgendaItem = async (itemId: string) => {
    const result = await removeTemplateAgendaItem(itemId)
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const handleRemovePosition = async (positionId: string) => {
    const result = await removeTemplatePosition(positionId)
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const handleUpdatePositionQuantity = async (positionId: string, quantityNeeded: number) => {
    const result = await updateTemplatePosition(positionId, { quantityNeeded })
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const items = [...template.event_template_agenda_items]
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Reorder the items
    const [movedItem] = items.splice(oldIndex, 1)
    items.splice(newIndex, 0, movedItem)

    // Get new order of IDs
    const newOrder = items.map((item) => item.id)

    // Update on server
    const result = await reorderTemplateAgendaItems(template.id, newOrder)
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const agendaItems = template.event_template_agenda_items || []
  const positions = template.event_template_positions || []

  return (
    <Card className="h-full flex flex-col border border-black dark:border-zinc-700">
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <EventTypeBadge type={template.event_type} />
              <VisibilityBadge visibility={template.visibility} />
            </div>
            <h2 className="text-xl font-semibold truncate">{template.name}</h2>
            {template.description && (
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimeString(template.default_start_time)}</span>
                <span>•</span>
                <span>{formatDurationMinutes(template.default_duration_minutes)}</span>
              </div>
              {template.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{template.location.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-gray-300 dark:!border-zinc-600"
              onClick={() => setCreateEventDialogOpen(true)}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                    <Copy className="w-4 h-4 mr-2" />
                    {isDuplicating ? 'Duplicating...' : 'Duplicate Template'}
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Template
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mb-4 border border-black dark:border-zinc-700">
            <TabsTrigger value="agenda" className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
              <Music className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="positions" className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
              <Users className="w-4 h-4" />
              Positions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="flex-1 overflow-y-auto mt-0 min-h-0">
            <div className="space-y-2">
              {agendaItems.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-3">No agenda items yet</p>
                  {canManage && (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline-pill"
                        size="sm"
                        className="!border !border-gray-300 dark:!border-zinc-600"
                        onClick={() => handleAddAgendaItem(false)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="!rounded-full !border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
                        onClick={() => handleAddAgendaItem(true)}
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Add Song
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={agendaItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {agendaItems.map((item) => (
                          <SortableTemplateAgendaItem
                            key={item.id}
                            item={item}
                            canManage={canManage}
                            onEdit={handleEditAgendaItem}
                            onRemove={handleRemoveAgendaItem}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  {canManage && (
                    <div className="flex justify-center gap-2 pt-2">
                      <Button
                        variant="outline-pill"
                        size="sm"
                        className="!border !border-gray-300 dark:!border-zinc-600"
                        onClick={() => handleAddAgendaItem(false)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="!rounded-full !border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
                        onClick={() => handleAddAgendaItem(true)}
                      >
                        <Music className="w-4 h-4 mr-2" />
                        Add Song
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="positions" className="flex-1 overflow-y-auto mt-0 min-h-0">
            <div className="space-y-2">
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-3">No positions defined</p>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full !border !border-gray-300 dark:!border-zinc-600"
                      onClick={() => setPositionPickerOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Positions
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {positions.map((position) => (
                    <div
                      key={position.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{position.title}</span>
                          {position.quantity_needed > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              ×{position.quantity_needed}
                            </Badge>
                          )}
                        </div>
                        {position.ministry && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {position.ministry.name}
                            {position.role && ` • ${position.role.name}`}
                          </div>
                        )}
                        {position.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            {position.notes}
                          </div>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdatePositionQuantity(
                                position.id,
                                Math.max(1, position.quantity_needed - 1)
                              )
                            }
                            disabled={position.quantity_needed <= 1}
                          >
                            <span className="text-lg">−</span>
                          </Button>
                          <span className="w-6 text-center text-sm">{position.quantity_needed}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              handleUpdatePositionQuantity(position.id, position.quantity_needed + 1)
                            }
                          >
                            <span className="text-lg">+</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleRemovePosition(position.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {canManage && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full !border !border-gray-300 dark:!border-zinc-600"
                        onClick={() => setPositionPickerOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Positions
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Agenda Item Dialog */}
      <TemplateAgendaItemDialog
        open={agendaItemDialogOpen}
        onOpenChange={setAgendaItemDialogOpen}
        templateId={template.id}
        item={editingAgendaItem}
        onSuccess={() => {
          setAgendaItemDialogOpen(false)
          setEditingAgendaItem(null)
          onTemplateUpdated()
        }}
      />

      {/* Position Picker */}
      <TemplatePositionPicker
        open={positionPickerOpen}
        onOpenChange={setPositionPickerOpen}
        templateId={template.id}
        existingPositions={positions}
        onSuccess={() => {
          setPositionPickerOpen(false)
          onTemplateUpdated()
        }}
      />

      {/* Create Event Dialog */}
      <CreateEventFromTemplateDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        template={template}
      />
    </Card>
  )
})
