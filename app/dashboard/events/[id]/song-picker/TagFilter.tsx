'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { X } from 'lucide-react'
import type { Tag } from './types'

interface TagFilterProps {
  allTags: Tag[]
  filterTagIds: string[]
  tagFilterOpen: boolean
  onTagFilterOpenChange: (open: boolean) => void
  onToggleTag: (tagId: string) => void
}

export const TagFilter = memo(function TagFilter({
  allTags,
  filterTagIds,
  tagFilterOpen,
  onTagFilterOpenChange,
  onToggleTag,
}: TagFilterProps) {
  if (allTags.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Popover open={tagFilterOpen} onOpenChange={onTagFilterOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 rounded-full">
            Tags
            {filterTagIds.length > 0 && (
              <Badge className="ml-1 h-5 px-1.5 text-xs bg-brand text-brand-foreground rounded-full">
                {filterTagIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 bg-white dark:bg-zinc-950 border" align="start">
          <div className="space-y-1">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onToggleTag(tag.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                  filterTagIds.includes(tag.id)
                    ? 'bg-gray-100 dark:bg-zinc-800'
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm">{tag.name}</span>
                {filterTagIds.includes(tag.id) && (
                  <span className="ml-auto text-brand">✓</span>
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Show selected filter tags */}
      {filterTagIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filterTagIds.map((tagId) => {
            const tag = allTags.find((t) => t.id === tagId)
            return tag ? (
              <Badge
                key={tag.id}
                style={{ backgroundColor: tag.color }}
                className="text-white text-xs cursor-pointer rounded-full"
                onClick={() => onToggleTag(tag.id)}
              >
                {tag.name}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
})
