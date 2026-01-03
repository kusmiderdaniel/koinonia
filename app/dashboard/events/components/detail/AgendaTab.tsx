'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { ListOrdered, Music, Plus, Printer } from 'lucide-react'
import Link from 'next/link'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableAgendaItem } from '../SortableAgendaItem'
import type { AgendaTabProps } from './types'

export const AgendaTab = memo(function AgendaTab({
  selectedEvent,
  sortedAgendaItems,
  totalDuration,
  canManageContent,
  sensors,
  formatDuration,
  onDragEnd,
  onAddAgendaItem,
  onAddSong,
  onEditAgendaItem,
  onDeleteAgendaItem,
  onAgendaKeyChange,
  onAgendaLeaderChange,
  onAgendaDurationChange,
  onAgendaDescriptionChange,
  onSongPlaceholderClick,
}: AgendaTabProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {sortedAgendaItems.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {sortedAgendaItems.length} items • Total: {formatDuration(totalDuration)}
              </p>
              <Link href={`/dashboard/events/${selectedEvent.id}/print`} target="_blank">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
              </Link>
            </>
          )}
        </div>
        {canManageContent && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline-pill"
              size="sm"
              className="!border !border-gray-300 dark:!border-zinc-600"
              onClick={onAddAgendaItem}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="!rounded-full !border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
              onClick={onAddSong}
            >
              <Music className="w-4 h-4 mr-1" />
              Add Song
            </Button>
          </div>
        )}
      </div>

      {sortedAgendaItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No agenda items yet</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={sortedAgendaItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sortedAgendaItems.map((item, index) => (
                <SortableAgendaItem
                  key={item.id}
                  item={item}
                  index={index}
                  canManage={canManageContent}
                  formatDuration={formatDuration}
                  onEdit={onEditAgendaItem}
                  onDelete={onDeleteAgendaItem}
                  onKeyChange={onAgendaKeyChange}
                  onLeaderChange={onAgendaLeaderChange}
                  onDurationChange={onAgendaDurationChange}
                  onDescriptionChange={onAgendaDescriptionChange}
                  onSongPlaceholderClick={onSongPlaceholderClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
})
