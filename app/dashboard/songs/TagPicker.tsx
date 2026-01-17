'use client'

import { useState, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, Plus, X } from 'lucide-react'
import { createTag } from './actions'

interface Tag {
  id: string
  name: string
  color: string
}

interface TagPickerProps {
  availableTags: Tag[]
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  onTagCreated?: (tag: Tag) => void
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

export const TagPicker = memo(function TagPicker({
  availableTags,
  selectedTagIds,
  onChange,
  onTagCreated,
}: TagPickerProps) {
  const t = useTranslations('songs')
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(tag.id))

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsCreating(true)
    const result = await createTag({
      name: newTagName.trim(),
      color: newTagColor,
    })

    if (result.data) {
      onTagCreated?.(result.data)
      setNewTagName('')
      setNewTagColor(PRESET_COLORS[0])
      setShowCreateForm(false)
    }
    setIsCreating(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="flex w-full items-center justify-between rounded-md border border-black/20 dark:border-white/20 bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[42px] h-auto"
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedTags.length === 0 ? (
              <span className="text-muted-foreground">{t('tagPicker.placeholder')}</span>
            ) : (
              selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color }}
                  className="text-white rounded-full px-3"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(tag.id, e)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50 flex-shrink-0" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white dark:bg-zinc-950 border border-black/20 dark:border-white/20" align="start">
        {/* Existing Tags */}
        {availableTags.length > 0 && (
          <div className="space-y-1 mb-3">
            {availableTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={() => handleToggleTag(tag.id)}
                  className="border-black/20 dark:border-white/20"
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        {availableTags.length > 0 && <div className="border-t border-black/20 dark:border-white/20 my-3" />}

        {/* Create New Tag */}
        {showCreateForm ? (
          <div className="space-y-3">
            <Input
              placeholder={t('tagPicker.tagNamePlaceholder')}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateTag()
                }
              }}
              className="!border-black/20 dark:!border-white/20"
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
                  setShowCreateForm(false)
                  setNewTagName('')
                }}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 !bg-brand hover:!bg-brand/90 !text-brand-foreground"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreating}
              >
                {isCreating ? t('tagPicker.creating') : t('tagPicker.create')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('tagPicker.createNewTag')}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
})
