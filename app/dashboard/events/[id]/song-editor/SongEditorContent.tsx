'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { User, Trash2, RefreshCw, Save } from 'lucide-react'
import { KeySelector } from './KeySelector'

interface SongEditorContentProps {
  selectedKey: string | null
  selectedLeaderName: string | null
  description: string
  ministryId: string | null
  isSaving: boolean
  isSavingNotes: boolean
  isRemoving: boolean
  onKeyChange: (key: string) => void
  onOpenLeaderPicker: () => void
  onDescriptionChange: (description: string) => void
  onDescriptionSave: () => void
  onRemove: () => void
  onReplace: () => void
  onClose: () => void
}

export function SongEditorContent({
  selectedKey,
  selectedLeaderName,
  description,
  ministryId,
  isSaving,
  isSavingNotes,
  isRemoving,
  onKeyChange,
  onOpenLeaderPicker,
  onDescriptionChange,
  onDescriptionSave,
  onRemove,
  onReplace,
  onClose,
}: SongEditorContentProps) {
  return (
    <>
      {/* Key Selection */}
      <KeySelector
        selectedKey={selectedKey}
        onKeyChange={onKeyChange}
        disabled={isSaving}
      />

      {/* Leader Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Leader</label>
        <button
          type="button"
          onClick={onOpenLeaderPicker}
          disabled={!ministryId || isSaving}
          className="w-full text-left p-3 rounded-lg border border-gray-900 dark:border-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedLeaderName ? (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>{selectedLeaderName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {ministryId ? 'Select leader...' : 'No ministry assigned'}
            </span>
          )}
        </button>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onDescriptionSave}
          placeholder="Add notes for this song..."
          className="min-h-[80px] text-sm resize-none"
          disabled={isSavingNotes}
        />
        {isSavingNotes && (
          <p className="text-xs text-muted-foreground">Saving...</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 rounded-full border-red-600 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={onRemove}
          disabled={isSaving || isRemoving}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-full border-gray-900 dark:border-zinc-300"
          onClick={onReplace}
          disabled={isSaving || isRemoving}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Replace
        </Button>
        <Button
          className="flex-1 rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
          onClick={onClose}
          disabled={isSaving || isRemoving}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </>
  )
}
