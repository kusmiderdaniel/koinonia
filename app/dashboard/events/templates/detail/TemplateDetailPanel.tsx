'use client'

import { useState, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music, Users } from 'lucide-react'
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  removeTemplateAgendaItem,
  reorderTemplateAgendaItems,
  removeTemplatePosition,
  updateTemplatePosition,
  duplicateEventTemplate,
} from '../actions'
import { toast } from 'sonner'
import { TemplateAgendaItemDialog } from '../TemplateAgendaItemDialog'
import { TemplatePositionPicker } from '../TemplatePositionPicker'
import { CreateEventFromTemplateDialog } from '../CreateEventFromTemplateDialog'
import { TemplateHeader } from './TemplateHeader'
import { TemplateAgendaSection } from './TemplateAgendaSection'
import { TemplatePositionsSection } from './TemplatePositionsSection'
import type { TemplateDetailPanelProps, AgendaItem } from './types'

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
    setEditingAgendaItem(
      isSongPlaceholder ? ({ is_song_placeholder: true } as AgendaItem) : null
    )
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

    const [movedItem] = items.splice(oldIndex, 1)
    items.splice(newIndex, 0, movedItem)

    const newOrder = items.map((item) => item.id)

    const result = await reorderTemplateAgendaItems(template.id, newOrder)
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const agendaItems = template.event_template_agenda_items || []
  const positions = template.event_template_positions || []

  return (
    <Card className="h-full flex flex-col border border-black dark:border-zinc-700 gap-0">
      <TemplateHeader
        template={template}
        canManage={canManage}
        canDelete={canDelete}
        isDuplicating={isDuplicating}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
        onDuplicate={handleDuplicate}
        onCreateEvent={() => setCreateEventDialogOpen(true)}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden gap-0"
      >
        <div className="px-6 py-1 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="agenda"
              className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
            >
              <Music className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
            >
              <Users className="w-4 h-4" />
              Positions
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="agenda"
          className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0 min-h-0"
        >
          <div className="space-y-2">
            <TemplateAgendaSection
              agendaItems={agendaItems}
              canManage={canManage}
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onAddItem={handleAddAgendaItem}
              onEditItem={handleEditAgendaItem}
              onRemoveItem={handleRemoveAgendaItem}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="positions"
          className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0 min-h-0"
        >
          <div className="space-y-2">
            <TemplatePositionsSection
              positions={positions}
              canManage={canManage}
              onAddPosition={() => setPositionPickerOpen(true)}
              onRemovePosition={handleRemovePosition}
              onUpdateQuantity={handleUpdatePositionQuantity}
            />
          </div>
        </TabsContent>
      </Tabs>

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

      <CreateEventFromTemplateDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        template={template}
      />
    </Card>
  )
})
