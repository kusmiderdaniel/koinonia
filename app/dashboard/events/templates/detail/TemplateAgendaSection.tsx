'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ListOrdered, Plus, Music } from 'lucide-react'
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
  onMoveItemUp,
  onMoveItemDown,
}: TemplateAgendaSectionProps) {
  const t = useTranslations('events.templatesTab')

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center justify-between py-4 min-h-[72px]">
        <div className="flex items-center gap-3">
          {agendaItems.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('itemsCount', { count: agendaItems.length })}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-black dark:!border-white"
              onClick={() => onAddItem(false)}
            >
              <Plus className="w-4 h-4 mr-1" />
              {t('addItem')}
            </Button>
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
              onClick={() => onAddItem(true)}
            >
              <Music className="w-4 h-4 mr-1" />
              {t('addSong')}
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-6 scrollbar-minimal">
        {agendaItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noAgendaItemsYet')}</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={agendaItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {agendaItems.map((item, index) => (
                  <SortableTemplateAgendaItem
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={agendaItems.length}
                    canManage={canManage}
                    onEdit={onEditItem}
                    onRemove={onRemoveItem}
                    onMoveUp={onMoveItemUp}
                    onMoveDown={onMoveItemDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
})
