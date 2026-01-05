'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Music } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  updateAgendaItemSongKey,
  updateAgendaItemLeader,
  updateAgendaItemDescription,
  removeAgendaItem,
} from '../../actions'
import { SongEditorContent } from './SongEditorContent'
import { LeaderPicker } from './LeaderPicker'
import type { SongEditorProps } from './types'

export function SongEditor({
  open,
  onOpenChange,
  agendaItemId,
  songTitle,
  currentKey,
  currentLeaderId,
  currentLeaderName,
  currentDescription,
  ministryId,
  eventDate,
  onSuccess,
  onDataChange,
  onReplaceSong,
}: SongEditorProps) {
  // State
  const [selectedKey, setSelectedKey] = useState<string | null>(currentKey)
  const [selectedLeaderName, setSelectedLeaderName] = useState<string | null>(currentLeaderName)
  const [description, setDescription] = useState<string>(currentDescription || '')
  const [showLeaderPicker, setShowLeaderPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedKey(currentKey)
      setSelectedLeaderName(currentLeaderName)
      setDescription(currentDescription || '')
      setError(null)
      setShowLeaderPicker(false)
    }
  }, [open, currentKey, currentLeaderName, currentDescription])

  // Handlers
  const handleKeyChange = useCallback(
    async (key: string) => {
      const newKey = key === 'none' ? null : key
      setSelectedKey(newKey)
      setIsSaving(true)
      setError(null)

      const result = await updateAgendaItemSongKey(agendaItemId, newKey)

      if (result.error) {
        setError(result.error)
      } else {
        onDataChange?.()
      }
      setIsSaving(false)
    },
    [agendaItemId, onDataChange]
  )

  const handleLeaderChange = useCallback(
    async (leaderId: string | null, leaderName: string | null) => {
      setIsSaving(true)
      setError(null)

      const result = await updateAgendaItemLeader(agendaItemId, leaderId)

      if (result.error) {
        setError(result.error)
        setIsSaving(false)
      } else {
        setSelectedLeaderName(leaderName)
        setIsSaving(false)
        setShowLeaderPicker(false)
        onDataChange?.()
      }
    },
    [agendaItemId, onDataChange]
  )

  const handleDescriptionSave = useCallback(async () => {
    setIsSavingNotes(true)
    setError(null)

    const result = await updateAgendaItemDescription(
      agendaItemId,
      description.trim() || null
    )

    if (result.error) {
      setError(result.error)
    }
    setIsSavingNotes(false)
  }, [agendaItemId, description])

  const handleRemoveClick = useCallback(() => {
    setShowDeleteConfirm(true)
  }, [])

  const handleConfirmRemove = useCallback(async () => {
    setIsRemoving(true)
    setError(null)

    const result = await removeAgendaItem(agendaItemId)

    if (result.error) {
      setError(result.error)
      setIsRemoving(false)
      setShowDeleteConfirm(false)
    } else {
      setIsRemoving(false)
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onSuccess()
    }
  }, [agendaItemId, onOpenChange, onSuccess])

  const handleReplaceSong = useCallback(() => {
    onOpenChange(false)
    onReplaceSong()
  }, [onOpenChange, onReplaceSong])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-indigo-600" />
              {songTitle}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
              {error}
            </div>
          )}

          {!showLeaderPicker ? (
            <SongEditorContent
              selectedKey={selectedKey}
              selectedLeaderName={selectedLeaderName}
              description={description}
              ministryId={ministryId}
              isSaving={isSaving}
              isSavingNotes={isSavingNotes}
              isRemoving={isRemoving}
              onKeyChange={handleKeyChange}
              onOpenLeaderPicker={() => setShowLeaderPicker(true)}
              onDescriptionChange={setDescription}
              onDescriptionSave={handleDescriptionSave}
              onRemove={handleRemoveClick}
              onReplace={handleReplaceSong}
              onClose={() => onOpenChange(false)}
            />
          ) : ministryId ? (
            <LeaderPicker
              ministryId={ministryId}
              eventDate={eventDate}
              currentLeaderId={currentLeaderId}
              onSelectLeader={handleLeaderChange}
              onBack={() => setShowLeaderPicker(false)}
              disabled={isSaving}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Remove Song?"
        description={
          <>
            Are you sure you want to remove <strong>{songTitle}</strong> from
            the agenda?
          </>
        }
        confirmLabel="Remove"
        destructive
        isLoading={isRemoving}
        onConfirm={handleConfirmRemove}
      />
    </>
  )
}
