'use client'

import { useState, useEffect, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Music, Users } from 'lucide-react'
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useIsMobile } from '@/lib/hooks'
import {
  removeTemplateAgendaItem,
  reorderTemplateAgendaItems,
  removeTemplatePosition,
  updateTemplatePosition,
  duplicateEventTemplate,
  getMinistries,
} from '../actions'
import { getAgendaPresets } from '@/app/dashboard/settings/agenda-presets/actions'
import { toast } from 'sonner'
import { TemplateAgendaItemDialog } from '../TemplateAgendaItemDialog'
import { TemplatePositionPicker } from '../TemplatePositionPicker'
import { CreateEventFromTemplateDialog } from '../CreateEventFromTemplateDialog'
import { TemplateHeader } from './TemplateHeader'
import { TemplateAgendaSection } from './TemplateAgendaSection'
import { TemplatePositionsSection } from './TemplatePositionsSection'
import type { TemplateDetailPanelProps, AgendaItem } from './types'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

export const TemplateDetailPanel = memo(function TemplateDetailPanel({
  template,
  canManage,
  canDelete,
  timeFormat,
  onEdit,
  onDelete,
  onClose,
  onTemplateUpdated,
}: TemplateDetailPanelProps) {
  const t = useTranslations('events.templatesTab')
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('agenda')
  const [agendaItemDialogOpen, setAgendaItemDialogOpen] = useState(false)
  const [editingAgendaItem, setEditingAgendaItem] = useState<AgendaItem | null>(null)
  const [positionPickerOpen, setPositionPickerOpen] = useState(false)
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  // Pre-load ministries and presets for instant dialog opening
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [presets, setPresets] = useState<Preset[]>([])

  useEffect(() => {
    // Load data on mount so dialogs open instantly
    Promise.all([getMinistries(), getAgendaPresets()]).then(
      ([ministriesResult, presetsResult]) => {
        if (ministriesResult.data) setMinistries(ministriesResult.data)
        if (presetsResult.data) setPresets(presetsResult.data as Preset[])
      }
    )
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
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
      toast.success(t('duplicatedAs', { name: `${template.name} - copy` }))
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

  const handleMoveItemUp = async (itemId: string) => {
    const items = [...template.event_template_agenda_items].sort((a, b) => a.sort_order - b.sort_order)
    const index = items.findIndex((item) => item.id === itemId)
    if (index <= 0) return

    // Swap with previous item
    const temp = items[index]
    items[index] = items[index - 1]
    items[index - 1] = temp

    const newOrder = items.map((item) => item.id)
    const result = await reorderTemplateAgendaItems(template.id, newOrder)
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const handleMoveItemDown = async (itemId: string) => {
    const items = [...template.event_template_agenda_items].sort((a, b) => a.sort_order - b.sort_order)
    const index = items.findIndex((item) => item.id === itemId)
    if (index === -1 || index >= items.length - 1) return

    // Swap with next item
    const temp = items[index]
    items[index] = items[index + 1]
    items[index + 1] = temp

    const newOrder = items.map((item) => item.id)
    const result = await reorderTemplateAgendaItems(template.id, newOrder)
    if (!result.error) {
      onTemplateUpdated()
    }
  }

  const agendaItems = template.event_template_agenda_items || []
  const positions = template.event_template_positions || []

  return (
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-zinc-700 !gap-0 !py-0">
      <TemplateHeader
        template={template}
        canManage={canManage}
        canDelete={canDelete}
        isDuplicating={isDuplicating}
        timeFormat={timeFormat}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={onClose}
        onDuplicate={handleDuplicate}
        onCreateEvent={() => setCreateEventDialogOpen(true)}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0 overflow-hidden gap-0"
      >
        <div className={`border-b ${isMobile ? 'px-2 py-1' : 'px-6 py-3'}`}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="agenda"
              className={`flex items-center gap-1.5 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground ${isMobile ? 'text-xs py-1.5' : 'gap-2'}`}
            >
              <Music className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {t('agendaTab')}
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className={`flex items-center gap-1.5 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground ${isMobile ? 'text-xs py-1.5' : 'gap-2'}`}
            >
              <Users className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              {t('positionsTab')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda" className={`flex flex-col min-h-0 overflow-hidden mt-0 ${isMobile ? 'px-3' : 'px-6'}`}>
          <TemplateAgendaSection
            agendaItems={agendaItems}
            canManage={canManage}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onAddItem={handleAddAgendaItem}
            onEditItem={handleEditAgendaItem}
            onRemoveItem={handleRemoveAgendaItem}
            onMoveItemUp={handleMoveItemUp}
            onMoveItemDown={handleMoveItemDown}
          />
        </TabsContent>

        <TabsContent value="positions" className={`flex flex-col min-h-0 overflow-hidden mt-0 ${isMobile ? 'px-3' : 'px-6'}`}>
          <TemplatePositionsSection
            positions={positions}
            canManage={canManage}
            onAddPosition={() => setPositionPickerOpen(true)}
            onRemovePosition={handleRemovePosition}
            onUpdateQuantity={handleUpdatePositionQuantity}
          />
        </TabsContent>
      </Tabs>

      <TemplateAgendaItemDialog
        open={agendaItemDialogOpen}
        onOpenChange={setAgendaItemDialogOpen}
        templateId={template.id}
        item={editingAgendaItem}
        ministries={ministries}
        presets={presets}
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
