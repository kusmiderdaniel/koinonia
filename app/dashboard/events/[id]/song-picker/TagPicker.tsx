'use client'

import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus } from 'lucide-react'
import { createTag } from '../../../songs/actions'
import { PRESET_COLORS } from './constants'
import type { Tag } from './types'

interface TagPickerProps {
  allTags: Tag[]
  selectedTagIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleTag: (tagId: string) => void
  onTagCreated: (tag: Tag) => void
}

export const TagPicker = memo(function TagPicker({
  allTags,
  selectedTagIds,
  open,
  onOpenChange,
  onToggleTag,
  onTagCreated,
}: TagPickerProps) {
  const [showCreateTagForm, setShowCreateTagForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isCreatingTag, setIsCreatingTag] = useState(false)

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return

    setIsCreatingTag(true)
    const result = await createTag({
      name: newTagName.trim(),
      color: newTagColor,
    })

    if (result.data) {
      onTagCreated(result.data)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setShowCreateTagForm(false)
    }
    setIsCreatingTag(false)
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 h-auto min-h-10 py-2 !border !border-input">
          {selectedTagIds.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedTagIds.map((tagId) => {
                const tag = allTags.find((t) => t.id === tagId)
                return tag ? (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white text-xs rounded-full"
                  >
                    {tag.name}
                  </Badge>
                ) : null
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">Select tags</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white dark:bg-zinc-950 border" align="start">
        {/* Existing Tags */}
        {allTags.length > 0 && (
          <div className="space-y-1 mb-3">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onToggleTag(tag.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  selectedTagIds.includes(tag.id)
                    ? 'bg-gray-100 dark:bg-zinc-800'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm">{tag.name}</span>
                {selectedTagIds.includes(tag.id) && (
                  <span className="ml-auto text-brand">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {allTags.length > 0 && <div className="border-t my-3" />}

        {/* Create New Tag */}
        {showCreateTagForm ? (
          <div className="space-y-3">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateNewTag()
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                    newTagColor === color
                      ? 'border-2 border-gray-400'
                      : 'border-2 border-transparent hover:scale-110'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowCreateTagForm(false)
                  setNewTagName('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={handleCreateNewTag}
                disabled={!newTagName.trim() || isCreatingTag}
              >
                {isCreatingTag ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowCreateTagForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create new tag
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
})
