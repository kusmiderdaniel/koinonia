'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Music } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTemplateAgendaItem } from '../SortableTemplateAgendaItem'
import type { TemplateAgendaSectionProps } from './types'

export const TemplateAgendaSection = memo(function TemplateAgendaSection({
  agendaItems,
  canManage,
  sensors,
  onDragEnd,
  onAddItem,
  onEditItem,
  onRemoveItem,
}: TemplateAgendaSectionProps) {
  if (agendaItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground mb-3">No agenda items yet</p>
        {canManage && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-gray-300 dark:!border-zinc-600"
              onClick={() => onAddItem(false)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="!rounded-full !border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
              onClick={() => onAddItem(true)}
            >
              <Music className="w-4 h-4 mr-2" />
              Add Song
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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
                onEdit={onEditItem}
                onRemove={onRemoveItem}
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
            onClick={() => onAddItem(false)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="!rounded-full !border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
            onClick={() => onAddItem(true)}
          >
            <Music className="w-4 h-4 mr-2" />
            Add Song
          </Button>
        </div>
      )}
    </>
  )
})
