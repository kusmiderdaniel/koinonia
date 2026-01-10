'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Loader2 } from 'lucide-react'
import { formatDurationShort } from '@/lib/utils/format'
import { MAJOR_KEYS, MINOR_KEYS } from './types'
import type { Member } from './types'

export interface ArrangementOption {
  id: string
  name: string
  is_default: boolean
  duration_seconds: number | null
}

// Key Popover - for setting musical key on songs
interface KeyPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentKey: string | null
  canManage: boolean
  isUpdating: boolean
  onKeyChange: (key: string) => void
}

export function KeyPopover({
  open,
  onOpenChange,
  currentKey,
  canManage,
  isUpdating,
  onKeyChange,
}: KeyPopoverProps) {
  const t = useTranslations('songs.keyPicker')

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`text-xs rounded-full px-2 py-0.5 transition-colors ${
            canManage ? 'hover:opacity-80 cursor-pointer' : ''
          } ${
            currentKey
              ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
          disabled={!canManage || isUpdating}
        >
          {currentKey ? `${t('key')}: ${currentKey}` : t('setKey')}
        </button>
      </PopoverTrigger>
      {canManage && (
        <PopoverContent className="w-[220px] p-2 bg-white dark:bg-zinc-950 border" align="start">
          <div className="text-xs font-semibold text-muted-foreground px-1 py-1">{t('major')}</div>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {MAJOR_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => onKeyChange(k)}
                disabled={isUpdating}
                className={`px-1.5 py-1 text-xs rounded transition-colors ${
                  currentKey === k
                    ? 'bg-purple-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="text-xs font-semibold text-muted-foreground px-1 py-1 border-t pt-2">{t('minor')}</div>
          <div className="grid grid-cols-5 gap-1">
            {MINOR_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => onKeyChange(k)}
                disabled={isUpdating}
                className={`px-1.5 py-1 text-xs rounded transition-colors ${
                  currentKey === k
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
  )
}

// Duration Popover - for editing item duration
interface DurationPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formattedDuration: string
  editMinutes: string
  editSeconds: string
  canManage: boolean
  isUpdating: boolean
  onMinutesChange: (value: string) => void
  onSecondsChange: (value: string) => void
  onSave: () => void
}

export function DurationPopover({
  open,
  onOpenChange,
  formattedDuration,
  editMinutes,
  editSeconds,
  canManage,
  isUpdating,
  onMinutesChange,
  onSecondsChange,
  onSave,
}: DurationPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`text-xs rounded-full px-2 py-0.5 border transition-colors ${
            canManage ? 'hover:bg-muted cursor-pointer' : ''
          }`}
          disabled={!canManage || isUpdating}
        >
          {formattedDuration}
        </button>
      </PopoverTrigger>
      {canManage && (
        <PopoverContent className="w-[180px] p-3 bg-white dark:bg-zinc-950 border" align="start">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground">Duration (MM:SS)</div>
            <div className="flex items-center gap-1">
              <Input
                value={editMinutes}
                onChange={(e) => onMinutesChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-14 text-center h-8"
                placeholder="MM"
                maxLength={2}
              />
              <span className="text-lg font-medium text-muted-foreground">:</span>
              <Input
                value={editSeconds}
                onChange={(e) => onSecondsChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-14 text-center h-8"
                placeholder="SS"
                maxLength={2}
              />
            </div>
            <Button
              size="sm"
              className="w-full rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
              onClick={onSave}
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </PopoverContent>
      )}
    </Popover>
  )
}

// Description Popover - for editing notes
interface DescriptionPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDescription: string | null
  editDescription: string
  canManage: boolean
  isUpdating: boolean
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onClear: () => void
}

export function DescriptionPopover({
  open,
  onOpenChange,
  currentDescription,
  editDescription,
  canManage,
  isUpdating,
  onDescriptionChange,
  onSave,
  onClear,
}: DescriptionPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`text-xs text-left mt-1 transition-colors ${
            canManage ? 'hover:underline cursor-pointer' : ''
          } ${currentDescription ? 'text-muted-foreground line-clamp-1' : 'text-muted-foreground/50 italic'}`}
          disabled={!canManage || isUpdating}
        >
          {currentDescription || '+ Add notes...'}
        </button>
      </PopoverTrigger>
      {canManage && (
        <PopoverContent className="w-[280px] p-3 bg-white dark:bg-zinc-950 border" align="start">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground">Notes</div>
            <Textarea
              value={editDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Add notes for this item..."
              className="min-h-[80px] text-sm"
            />
            <div className="flex justify-end gap-2">
              {currentDescription && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs"
                  onClick={() => {
                    onClear()
                    onSave()
                  }}
                  disabled={isUpdating}
                >
                  Clear
                </Button>
              )}
              <Button
                size="sm"
                className="rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
                onClick={onSave}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  )
}

// Leader Popover - for assigning leader from ministry members
interface LeaderPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLeader: Member | null
  ministryId: string | null
  ministryMembers: Member[]
  isLoadingMembers: boolean
  canManage: boolean
  isUpdating: boolean
  onLeaderChange: (leaderId: string | null) => void
}

export function LeaderPopover({
  open,
  onOpenChange,
  currentLeader,
  ministryId,
  ministryMembers,
  isLoadingMembers,
  canManage,
  isUpdating,
  onLeaderChange,
}: LeaderPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`text-xs transition-colors ${
            canManage && ministryId ? 'hover:underline cursor-pointer' : ''
          } ${currentLeader ? 'text-foreground' : 'text-muted-foreground italic'}`}
          disabled={!canManage || isUpdating || !ministryId}
          title={!ministryId ? 'No ministry assigned' : undefined}
        >
          {currentLeader ? `${currentLeader.first_name} ${currentLeader.last_name}` : 'Not assigned'}
        </button>
      </PopoverTrigger>
      {canManage && ministryId && (
        <PopoverContent className="w-[220px] p-2 bg-white dark:bg-zinc-950 border max-h-[200px] overflow-y-auto" align="start">
          {isLoadingMembers ? (
            <p className="text-sm text-muted-foreground text-center py-2">Loading...</p>
          ) : ministryMembers.length === 0 ? (
            <div className="space-y-2 py-2">
              <p className="text-sm text-muted-foreground text-center">No members in this ministry</p>
              <button
                onClick={() => onLeaderChange(null)}
                disabled={isUpdating}
                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                  !currentLeader ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-muted-foreground italic">Not assigned</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => onLeaderChange(null)}
                disabled={isUpdating}
                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                  !currentLeader ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-muted-foreground italic">Not assigned</span>
              </button>
              {ministryMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onLeaderChange(member.id)}
                  disabled={isUpdating}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                    currentLeader?.id === member.id ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
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
  )
}

// Arrangement Popover - for changing song arrangement
interface ArrangementPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentArrangement: ArrangementOption | null
  arrangements: ArrangementOption[]
  isLoadingArrangements: boolean
  canManage: boolean
  isUpdating: boolean
  onArrangementChange: (arrangementId: string | null) => void
}

export function ArrangementPopover({
  open,
  onOpenChange,
  currentArrangement,
  arrangements,
  isLoadingArrangements,
  canManage,
  isUpdating,
  onArrangementChange,
}: ArrangementPopoverProps) {
  const displayName = currentArrangement?.name || 'Default'

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={`text-xs transition-colors ${
            canManage ? 'hover:underline cursor-pointer' : ''
          } text-muted-foreground`}
          disabled={!canManage || isUpdating}
        >
          {displayName}
        </button>
      </PopoverTrigger>
      {canManage && (
        <PopoverContent className="w-[220px] p-2 bg-white dark:bg-zinc-950 border max-h-[200px] overflow-y-auto" align="start">
          {isLoadingArrangements ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : arrangements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No arrangements available</p>
          ) : (
            <div className="space-y-1">
              {arrangements.map((arr) => (
                <button
                  key={arr.id}
                  onClick={() => onArrangementChange(arr.id)}
                  disabled={isUpdating}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                    currentArrangement?.id === arr.id
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {arr.name}
                      {arr.is_default && (
                        <span className="text-xs text-muted-foreground ml-1">(default)</span>
                      )}
                    </span>
                    {arr.duration_seconds && (
                      <span className="text-xs text-muted-foreground">
                        {formatDurationShort(arr.duration_seconds)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </PopoverContent>
      )}
    </Popover>
  )
}
