'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ListOrdered, Music, Plus, Printer } from 'lucide-react'
import Link from 'next/link'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useIsMobile } from '@/lib/hooks'
import { SortableAgendaItem } from '../sortable-agenda-item'
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
  onAgendaArrangementChange,
  onSongPlaceholderClick,
  onSongClick,
  onMoveAgendaItemUp,
  onMoveAgendaItemDown,
}: AgendaTabProps) {
  const t = useTranslations('events.agenda')
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className={`flex-shrink-0 ${isMobile ? 'px-3 py-2' : 'pl-6 pr-6 py-4'}`}>
        {/* Mobile: Buttons above summary */}
        {isMobile ? (
          <div className="space-y-1.5">
            {canManageContent && (
              <div className="flex gap-2">
                <Button
                  variant="outline-pill"
                  size="sm"
                  className="!border !border-black dark:!border-white text-xs h-8"
                  onClick={onAddAgendaItem}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('addItem')}
                </Button>
                <Button
                  variant="outline-pill"
                  size="sm"
                  className="!border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950 text-xs h-8"
                  onClick={onAddSong}
                >
                  <Music className="w-3.5 h-3.5 mr-1" />
                  {t('addSong')}
                </Button>
              </div>
            )}
            {sortedAgendaItems.length > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {t('itemsTotal', { count: sortedAgendaItems.length, duration: formatDuration(totalDuration) })}
                </p>
                <Link href={`/dashboard/events/${selectedEvent.id}/print`} target="_blank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Printer className="w-3 h-3" />
                    <span className="text-xs">{t('print')}</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Side by side */
          <div className="flex items-center justify-between min-h-[40px]">
            <div className="flex items-center gap-3">
              {sortedAgendaItems.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t('itemsTotal', { count: sortedAgendaItems.length, duration: formatDuration(totalDuration) })}
                  </p>
                  <Link href={`/dashboard/events/${selectedEvent.id}/print`} target="_blank">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('print')}</span>
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
                  className="!border !border-black dark:!border-white"
                  onClick={onAddAgendaItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('addItem')}
                </Button>
                <Button
                  variant="outline-pill"
                  size="sm"
                  className="!border !border-purple-400 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:!border-purple-600 dark:hover:bg-purple-950"
                  onClick={onAddSong}
                >
                  <Music className="w-4 h-4 mr-1" />
                  {t('addSong')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-minimal ${isMobile ? 'px-3 pb-3' : 'pl-6 pr-6 pb-6'}`}>
        {sortedAgendaItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ListOrdered className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('noItems')}</p>
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
                  totalItems={sortedAgendaItems.length}
                  canManage={canManageContent}
                  formatDuration={formatDuration}
                  onEdit={onEditAgendaItem}
                  onDelete={onDeleteAgendaItem}
                  onKeyChange={onAgendaKeyChange}
                  onLeaderChange={onAgendaLeaderChange}
                  onDurationChange={onAgendaDurationChange}
                  onDescriptionChange={onAgendaDescriptionChange}
                  onArrangementChange={onAgendaArrangementChange}
                  onSongPlaceholderClick={onSongPlaceholderClick}
                  onSongClick={onSongClick}
                  onMoveUp={onMoveAgendaItemUp}
                  onMoveDown={onMoveAgendaItemDown}
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
