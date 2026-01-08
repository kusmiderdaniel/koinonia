'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { TagPicker } from '../TagPicker'
import { ArtistPicker } from '../ArtistPicker'
import { KeyPicker } from './KeyPicker'
import { useSongDialogState } from './useSongDialogState'
import type { SongDialogProps } from './types'

export const SongDialog = memo(function SongDialog({
  open,
  onOpenChange,
  song,
  onSuccess,
  customAction,
  title: dialogTitle,
  submitText,
}: SongDialogProps) {
  const state = useSongDialogState(open, song, { customAction })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dialogTitle ?? (state.isEditing ? 'Edit Song' : 'Add Song')}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => state.handleSubmit(e, onSuccess)}
          className="space-y-4"
        >
          {state.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {state.error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={state.title}
              onChange={(e) => state.setTitle(e.target.value)}
              placeholder="Song title"
            />
          </div>

          {/* Artist */}
          <div className="space-y-2">
            <Label>Artist</Label>
            <ArtistPicker
              artists={state.availableArtists}
              value={state.artist}
              onChange={state.setArtist}
              onArtistCreated={state.handleArtistCreated}
            />
          </div>

          {/* Key and Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Default Key */}
            <div className="space-y-2">
              <Label>Default Key</Label>
              <KeyPicker
                value={state.defaultKey}
                open={state.keyPickerOpen}
                onOpenChange={state.setKeyPickerOpen}
                onSelect={state.handleKeySelect}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-1">
                <Input
                  value={state.durationMinutes}
                  onChange={(e) => state.handleMinutesChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  maxLength={2}
                />
                <span className="text-lg font-medium text-muted-foreground">
                  :
                </span>
                <Input
                  value={state.durationSeconds}
                  onChange={(e) => state.handleSecondsChange(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-16 text-center"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagPicker
              availableTags={state.availableTags}
              selectedTagIds={state.selectedTagIds}
              onChange={state.handleTagsChange}
              onTagCreated={state.handleTagCreated}
            />
          </div>

          <DialogFooter className="pt-4 !bg-transparent !border-t-0">
            <Button
              type="button"
              variant="outline-pill"
              className="!border-black dark:!border-white"
              onClick={() => onOpenChange(false)}
              disabled={state.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline-pill"
              disabled={state.isLoading}
              className="!bg-brand hover:!bg-brand/90 !text-white !border-brand"
            >
              {state.isLoading
                ? 'Saving...'
                : submitText ?? (state.isEditing ? 'Save Changes' : 'Add Song')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
