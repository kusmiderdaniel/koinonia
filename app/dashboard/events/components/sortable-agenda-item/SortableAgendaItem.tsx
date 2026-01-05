'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { GripVertical, Pencil, Trash2, Music } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSortableAgendaItemState } from './useSortableAgendaItemState'
import {
  KeyPopover,
  DurationPopover,
  DescriptionPopover,
  LeaderPopover,
} from './AgendaItemPopovers'
import type { SortableAgendaItemProps, Member } from './types'

export const SortableAgendaItem = memo(function SortableAgendaItem({
  item,
  index,
  canManage,
  formatDuration,
  onEdit,
  onDelete,
  onKeyChange,
  onLeaderChange,
  onDurationChange,
  onDescriptionChange,
  onSongPlaceholderClick,
}: SortableAgendaItemProps) {
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
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const leader = (Array.isArray(item.leader) ? item.leader[0] : item.leader) as Member | null
  const song = Array.isArray(item.song) ? item.song[0] : item.song
  const isSong = !!item.song_id && song
  const isSongPlaceholder = item.is_song_placeholder && !item.song_id

  const handlePlaceholderClick = () => {
    if (isSongPlaceholder && canManage) {
      onSongPlaceholderClick(item)
    }
  }

  const itemClassName = `flex items-start gap-3 p-3 border rounded-lg transition-all ${
    isSongPlaceholder
      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 border-dashed hover:bg-amber-100 dark:hover:bg-amber-950/50'
      : isSong
      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50'
      : 'bg-white dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900'
  } ${isDragging ? 'opacity-50 shadow-lg' : ''} ${isSongPlaceholder && canManage ? 'cursor-pointer' : ''}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={itemClassName}
      onClick={handlePlaceholderClick}
    >
      {/* Drag Handle */}
      {canManage && (
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      {/* Index Badge */}
      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${
        isSongPlaceholder
          ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
          : isSong
          ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
          : 'bg-muted'
      }`}>
        {isSongPlaceholder || isSong ? <Music className="w-3 h-3" /> : index + 1}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{item.title}</span>

          {isSongPlaceholder && canManage && (
            <span className="text-xs text-amber-600 dark:text-amber-400 italic">
              Click to select a song
            </span>
          )}

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
        </div>

        {/* Artist (for songs) */}
        {isSong && song?.artist && (
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            {song.artist}
          </p>
        )}

        {/* Description/Notes */}
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

        {/* Ministry Badge */}
        {item.ministry && (
          <div className="flex items-center gap-1 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.ministry.color }}
            />
            <span className="text-xs text-muted-foreground">{item.ministry.name}</span>
          </div>
        )}

        {/* Leader Assignment */}
        <div className="flex items-center gap-1 mt-1">
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
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isSong && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(item)}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  )
})
