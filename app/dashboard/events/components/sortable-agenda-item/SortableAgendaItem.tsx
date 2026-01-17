'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { GripVertical, Pencil, Trash2, ChevronUp, ChevronDown, FileText } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useIsMobile } from '@/lib/hooks'
import { useSortableAgendaItemState } from './useSortableAgendaItemState'
import {
  KeyPopover,
  DurationPopover,
  DescriptionPopover,
  LeaderPopover,
  ArrangementPopover,
} from './AgendaItemPopovers'
import type { SortableAgendaItemProps, Member } from './types'

export const SortableAgendaItem = memo(function SortableAgendaItem({
  item,
  index,
  totalItems,
  canManage,
  formatDuration,
  onEdit,
  onDelete,
  onKeyChange,
  onLeaderChange,
  onDurationChange,
  onDescriptionChange,
  onArrangementChange,
  onSongPlaceholderClick,
  onSongClick,
  onMoveUp,
  onMoveDown,
}: SortableAgendaItemProps) {
  const isMobile = useIsMobile()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const state = useSortableAgendaItemState({
    item,
    onKeyChange,
    onLeaderChange,
    onDurationChange,
    onDescriptionChange,
    onArrangementChange,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const leader = (Array.isArray(item.leader) ? item.leader[0] : item.leader) as Member | null
  const song = Array.isArray(item.song) ? item.song[0] : item.song
  const arrangement = Array.isArray(item.arrangement) ? item.arrangement[0] : item.arrangement
  const isSong = !!item.song_id && song
  const isSongPlaceholder = item.is_song_placeholder && !item.song_id

  const handleItemClick = () => {
    if (isSongPlaceholder && canManage) {
      onSongPlaceholderClick(item)
    }
  }

  const isClickable = isSongPlaceholder && canManage
  const itemClassName = `flex items-start gap-2 p-2 border rounded-lg transition-all select-none ${
    isSongPlaceholder
      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 border-dashed hover:bg-amber-100 dark:hover:bg-amber-950/50'
      : isSong
      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50'
      : 'bg-white dark:bg-zinc-950 border-black/20 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-zinc-900'
  } ${isDragging ? 'opacity-50 shadow-lg' : ''} ${isClickable ? 'cursor-pointer' : ''}`

  const canMoveUp = index > 0
  const canMoveDown = index < totalItems - 1

  // Unified layout for both mobile and desktop (mobile style)
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={itemClassName}
      onClick={handleItemClick}
    >
      {/* Reorder Controls */}
      {canManage && (
        isMobile ? (
          // Mobile: Up/Down arrows
          onMoveUp && onMoveDown && (
            <div className="flex flex-col -my-1 flex-shrink-0">
              <button
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={(e) => { e.stopPropagation(); onMoveUp(item.id) }}
                disabled={!canMoveUp}
                aria-label="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={(e) => { e.stopPropagation(); onMoveDown(item.id) }}
                disabled={!canMoveDown}
                aria-label="Move down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )
        ) : (
          // Desktop: Drag handle
          <button
            className="p-1 -m-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0 self-center"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Title + Duration + Key (for songs) + Actions */}
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate flex-1">{item.title}</span>

          <DurationPopover
            open={state.durationPopoverOpen}
            onOpenChange={state.handleDurationPopoverOpen}
            formattedDuration={formatDuration(item.duration_seconds)}
            editMinutes={state.editMinutes}
            editSeconds={state.editSeconds}
            canManage={canManage}
            isUpdating={state.isUpdating}
            onMinutesChange={state.handleMinutesInput}
            onSecondsChange={state.handleSecondsInput}
            onSave={state.handleDurationSave}
          />

          {isSong && (
            <KeyPopover
              open={state.keyPopoverOpen}
              onOpenChange={state.setKeyPopoverOpen}
              currentKey={item.song_key}
              canManage={canManage}
              isUpdating={state.isUpdating}
              onKeyChange={state.handleKeyChange}
            />
          )}

          {/* Actions */}
          <div className="flex items-center flex-shrink-0">
            {/* Lyrics button for songs */}
            {isSong && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={(e) => { e.stopPropagation(); onSongClick(item) }}
                title="View lyrics"
              >
                <FileText className="w-3 h-3" />
              </Button>
            )}
            {canManage && (
              <>
                {!isSong && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); onEdit(item) }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Artist + Arrangement (for songs) */}
        {isSong && (
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mt-0.5">
            {song?.artist && <span>{song.artist}</span>}
            {song?.artist && <span className="text-muted-foreground">·</span>}
            <ArrangementPopover
              open={state.arrangementPopoverOpen}
              onOpenChange={state.handleArrangementPopoverOpen}
              currentArrangement={arrangement}
              arrangements={state.arrangements}
              isLoadingArrangements={state.isLoadingArrangements}
              canManage={canManage}
              isUpdating={state.isUpdating}
              onArrangementChange={state.handleArrangementChange}
            />
          </div>
        )}

        {/* Row 3: Ministry */}
        {item.ministry && (
          <div className="flex items-center gap-1 mt-0.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.ministry.color }}
            />
            <span className="text-xs text-muted-foreground">{item.ministry.name}</span>
          </div>
        )}

        {/* Song placeholder message */}
        {isSongPlaceholder && canManage && (
          <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-0.5">
            Click to select a song
          </p>
        )}

        {/* For non-placeholders: Led by + Notes */}
        {!isSongPlaceholder && (
          <>
            {/* Led by */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs text-muted-foreground">Led by:</span>
              <LeaderPopover
                open={state.leaderPopoverOpen}
                onOpenChange={state.handleLeaderPopoverOpen}
                currentLeader={leader}
                ministryId={item.ministry_id}
                ministryMembers={state.ministryMembers}
                isLoadingMembers={state.isLoadingMembers}
                canManage={canManage}
                isUpdating={state.isUpdating}
                onLeaderChange={state.handleLeaderChange}
              />
            </div>

            {/* Notes */}
            <DescriptionPopover
              open={state.descriptionPopoverOpen}
              onOpenChange={state.handleDescriptionPopoverOpen}
              currentDescription={item.description}
              editDescription={state.editDescription}
              canManage={canManage}
              isUpdating={state.isUpdating}
              onDescriptionChange={state.setEditDescription}
              onSave={state.handleDescriptionSave}
              onClear={state.handleClearDescription}
            />
          </>
        )}
      </div>
    </div>
  )
})
