'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from '@/components/ui/dialog'
import { KeyPicker } from './KeyPicker'
import { TagPicker } from './TagPicker'
import type { Tag } from './types'

interface CreateSongFormProps {
  initialTitle: string
  allTags: Tag[]
  isAdding: boolean
  onBack: () => void
  onSubmit: (data: {
    title: string
    artist: string
    key: string
    durationMinutes: string
    durationSeconds: string
    tagIds: string[]
  }) => void
  onTagCreated: (tag: Tag) => void
}

export function CreateSongForm({
  initialTitle,
  allTags,
  isAdding,
  onBack,
  onSubmit,
  onTagCreated,
}: CreateSongFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [artist, setArtist] = useState('')
  const [key, setKey] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('0')
  const [durationSeconds, setDurationSeconds] = useState('00')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [keyPickerOpen, setKeyPickerOpen] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)

  const handleMinutesChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      setDurationMinutes(cleaned)
    }
  }

  const handleSecondsChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 2) {
      const num = parseInt(cleaned, 10)
      if (isNaN(num) || num < 60) {
        setDurationSeconds(cleaned)
      }
    }
  }

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleTagCreated = (tag: Tag) => {
    onTagCreated(tag)
    setTagIds((prev) => [...prev, tag.id])
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({
      title,
      artist,
      key,
      durationMinutes,
      durationSeconds,
      tagIds,
    })
  }

  return (
    <div className="space-y-4 py-2 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="space-y-2">
        <Label htmlFor="newTitle">Title *</Label>
        <Input
          id="newTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Song title"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newArtist">Artist</Label>
        <Input
          id="newArtist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist or band name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Key */}
        <div className="space-y-2">
          <Label>Key</Label>
          <KeyPicker
            value={key}
            open={keyPickerOpen}
            onOpenChange={setKeyPickerOpen}
            onSelect={setKey}
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="flex items-center gap-1">
            <Input
              value={durationMinutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-14 text-center"
              maxLength={2}
            />
            <span className="text-lg font-medium text-muted-foreground">:</span>
            <Input
              value={durationSeconds}
              onChange={(e) => handleSecondsChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="w-14 text-center"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagPicker
          allTags={allTags}
          selectedTagIds={tagIds}
          open={tagPickerOpen}
          onOpenChange={setTagPickerOpen}
          onToggleTag={toggleTag}
          onTagCreated={handleTagCreated}
        />
      </div>

      <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
        <Button variant="outline-pill-muted" onClick={onBack} disabled={isAdding}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isAdding || !title.trim()}
          className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
        >
          {isAdding ? 'Creating...' : 'Create & Add'}
        </Button>
      </DialogFooter>
    </div>
  )
}
