'use client'

import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { GripVertical, Pencil, Trash2, Music } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MUSICAL_KEYS } from '@/lib/constants/event'
import { getMinistryMembersForAgenda } from '../actions'
import type { AgendaItem, Member } from '../types'

// Split keys into major and minor
const MAJOR_KEYS = MUSICAL_KEYS.filter(k => !k.endsWith('m'))
const MINOR_KEYS = MUSICAL_KEYS.filter(k => k.endsWith('m'))

interface SortableAgendaItemProps {
  item: AgendaItem
  index: number
  canManage: boolean
  formatDuration: (seconds: number) => string
  onEdit: (item: AgendaItem) => void
  onDelete: (item: AgendaItem) => void
  onKeyChange: (itemId: string, key: string | null) => Promise<void>
  onLeaderChange: (itemId: string, leaderId: string | null) => Promise<void>
  onDurationChange: (itemId: string, durationSeconds: number) => Promise<void>
  onDescriptionChange: (itemId: string, description: string | null) => Promise<void>
  onSongPlaceholderClick: (item: AgendaItem) => void
}

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
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false)
  const [leaderPopoverOpen, setLeaderPopoverOpen] = useState(false)
  const [durationPopoverOpen, setDurationPopoverOpen] = useState(false)
  const [descriptionPopoverOpen, setDescriptionPopoverOpen] = useState(false)
  const [editMinutes, setEditMinutes] = useState('')
  const [editSeconds, setEditSeconds] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [ministryMembers, setMinistryMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const leader = Array.isArray(item.leader) ? item.leader[0] : item.leader
  const song = Array.isArray(item.song) ? item.song[0] : item.song
  const isSong = !!item.song_id && song
  const isSongPlaceholder = item.is_song_placeholder && !item.song_id

  const handleKeyChange = async (key: string) => {
    setIsUpdating(true)
    await onKeyChange(item.id, key)
    setKeyPopoverOpen(false)
    setIsUpdating(false)
  }

  const handleLeaderChange = async (leaderId: string | null) => {
    setIsUpdating(true)
    await onLeaderChange(item.id, leaderId)
    setLeaderPopoverOpen(false)
    setIsUpdating(false)
  }

  const handleLeaderPopoverOpen = async (open: boolean) => {
    setLeaderPopoverOpen(open)
    if (open && item.ministry_id) {
      setIsLoadingMembers(true)
      const result = await getMinistryMembersForAgenda(item.ministry_id)
      if (result.data) {
        setMinistryMembers(result.data as Member[])
      }
      setIsLoadingMembers(false)
    }
  }

  const handleDurationPopoverOpen = (open: boolean) => {
    if (open) {
      const mins = Math.floor(item.duration_seconds / 60)
      const secs = item.duration_seconds % 60
      setEditMinutes(mins.toString())
      setEditSeconds(secs.toString().padStart(2, '0'))
    }
    setDurationPopoverOpen(open)
  }

  const handleDurationSave = async () => {
    const mins = parseInt(editMinutes, 10) || 0
    const secs = parseInt(editSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs
    if (totalSeconds > 0) {
      setIsUpdating(true)
      await onDurationChange(item.id, totalSeconds)
      setDurationPopoverOpen(false)
      setIsUpdating(false)
    }
  }

  const handleMinutesInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setEditMinutes(cleaned)
    }
  }

  const handleSecondsInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setEditSeconds(cleaned)
      }
    }
  }

  const handleDescriptionPopoverOpen = (open: boolean) => {
    if (open) {
      setEditDescription(item.description || '')
    }
    setDescriptionPopoverOpen(open)
  }

  const handleDescriptionSave = async () => {
    setIsUpdating(true)
    await onDescriptionChange(item.id, editDescription.trim() || null)
    setDescriptionPopoverOpen(false)
    setIsUpdating(false)
  }

  const handlePlaceholderClick = () => {
    if (isSongPlaceholder && canManage) {
      onSongPlaceholderClick(item)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
        isSongPlaceholder
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 border-dashed hover:bg-amber-100 dark:hover:bg-amber-950/50'
          : isSong
          ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50'
          : 'bg-white dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-900'
      } ${isDragging ? 'opacity-50 shadow-lg' : ''} ${isSongPlaceholder && canManage ? 'cursor-pointer' : ''}`}
      onClick={handlePlaceholderClick}
    >
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
      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${
        isSongPlaceholder
          ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200'
          : isSong
          ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
          : 'bg-muted'
      }`}>
        {isSongPlaceholder || isSong ? <Music className="w-3 h-3" /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{item.title}</span>
          {isSongPlaceholder && canManage && (
            <span className="text-xs text-amber-600 dark:text-amber-400 italic">
              Click to select a song
            </span>
          )}
          {isSong && (
            <Popover open={keyPopoverOpen} onOpenChange={setKeyPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`text-xs rounded-full px-2 py-0.5 transition-colors ${
                    canManage ? 'hover:opacity-80 cursor-pointer' : ''
                  } ${
                    item.song_key
                      ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                  disabled={!canManage || isUpdating}
                >
                  {item.song_key ? `Key: ${item.song_key}` : 'Set key'}
                </button>
              </PopoverTrigger>
              {canManage && (
                <PopoverContent className="w-[220px] p-2 bg-white dark:bg-zinc-950 border" align="start">
                  <div className="text-xs font-semibold text-muted-foreground px-1 py-1">Major</div>
                  <div className="grid grid-cols-5 gap-1 mb-2">
                    {MAJOR_KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => handleKeyChange(k)}
                        disabled={isUpdating}
                        className={`px-1.5 py-1 text-xs rounded transition-colors ${
                          item.song_key === k
                            ? 'bg-purple-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t pt-2">Minor</div>
                  <div className="grid grid-cols-5 gap-1">
                    {MINOR_KEYS.map((k) => (
                      <button
                        key={k}
                        onClick={() => handleKeyChange(k)}
                        disabled={isUpdating}
                        className={`px-1.5 py-1 text-xs rounded transition-colors ${
                          item.song_key === k
                            ? 'bg-purple-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          )}
          <Popover open={durationPopoverOpen} onOpenChange={handleDurationPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={`text-xs rounded-full px-2 py-0.5 border transition-colors ${
                  canManage ? 'hover:bg-muted cursor-pointer' : ''
                }`}
                disabled={!canManage || isUpdating}
              >
                {formatDuration(item.duration_seconds)}
              </button>
            </PopoverTrigger>
            {canManage && (
              <PopoverContent className="w-[180px] p-3 bg-white dark:bg-zinc-950 border" align="start">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-muted-foreground">Duration (MM:SS)</div>
                  <div className="flex items-center gap-1">
                    <Input
                      value={editMinutes}
                      onChange={(e) => handleMinutesInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-14 text-center h-8"
                      placeholder="MM"
                      maxLength={2}
                    />
                    <span className="text-lg font-medium text-muted-foreground">:</span>
                    <Input
                      value={editSeconds}
                      onChange={(e) => handleSecondsInput(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-14 text-center h-8"
                      placeholder="SS"
                      maxLength={2}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
                    onClick={handleDurationSave}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </PopoverContent>
            )}
          </Popover>
        </div>
        {isSong && song?.artist && (
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            {song.artist}
          </p>
        )}
        {/* Description/Notes - editable for all items */}
        <Popover open={descriptionPopoverOpen} onOpenChange={handleDescriptionPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className={`text-xs text-left mt-1 transition-colors ${
                canManage ? 'hover:underline cursor-pointer' : ''
              } ${item.description ? 'text-muted-foreground line-clamp-1' : 'text-muted-foreground/50 italic'}`}
              disabled={!canManage || isUpdating}
            >
              {item.description || '+ Add notes...'}
            </button>
          </PopoverTrigger>
          {canManage && (
            <PopoverContent className="w-[280px] p-3 bg-white dark:bg-zinc-950 border" align="start">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground">Notes</div>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add notes for this item..."
                  className="min-h-[80px] text-sm"
                />
                <div className="flex justify-end gap-2">
                  {item.description && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs"
                      onClick={() => {
                        setEditDescription('')
                        handleDescriptionSave()
                      }}
                      disabled={isUpdating}
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
                    onClick={handleDescriptionSave}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
        {/* Ministry badge */}
        {item.ministry && (
          <div className="flex items-center gap-1 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.ministry.color }}
            />
            <span className="text-xs text-muted-foreground">{item.ministry.name}</span>
          </div>
        )}
        {/* Led by - always show with inline dropdown */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">Led by:</span>
          <Popover open={leaderPopoverOpen} onOpenChange={handleLeaderPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className={`text-xs transition-colors ${
                  canManage && item.ministry_id ? 'hover:underline cursor-pointer' : ''
                } ${leader ? 'text-foreground' : 'text-muted-foreground italic'}`}
                disabled={!canManage || isUpdating || !item.ministry_id}
                title={!item.ministry_id ? 'No ministry assigned' : undefined}
              >
                {leader ? `${leader.first_name} ${leader.last_name}` : 'Not assigned'}
              </button>
            </PopoverTrigger>
            {canManage && item.ministry_id && (
              <PopoverContent className="w-[220px] p-2 bg-white dark:bg-zinc-950 border max-h-[200px] overflow-y-auto" align="start">
                {isLoadingMembers ? (
                  <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
                ) : ministryMembers.length === 0 ? (
                  <div className="space-y-2 py-2">
                    <p className="text-sm text-muted-foreground text-center">No members in this ministry</p>
                    <button
                      onClick={() => handleLeaderChange(null)}
                      disabled={isUpdating}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                        !leader ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-muted-foreground italic">Not assigned</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => handleLeaderChange(null)}
                      disabled={isUpdating}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                        !leader ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-muted-foreground italic">Not assigned</span>
                    </button>
                    {ministryMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleLeaderChange(member.id)}
                        disabled={isUpdating}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                          leader?.id === member.id ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {member.first_name} {member.last_name}
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            )}
          </Popover>
        </div>
      </div>
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
