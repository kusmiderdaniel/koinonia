'use client'

import { memo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical, Instagram, Facebook, Youtube, Twitter, Globe, Mail, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SocialLink, SocialPlatform } from '../types'

interface SocialLinksEditorProps {
  links: SocialLink[]
  onChange: (links: SocialLink[]) => void
}

const PLATFORMS: { value: SocialPlatform; label: string; placeholder: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourchurch', icon: Instagram },
  { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourchurch', icon: Facebook },
  { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchurch', icon: Youtube },
  { value: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourchurch', icon: Twitter },
  { value: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourchurch', icon: Music },
  { value: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...', icon: Music },
  { value: 'website', label: 'Website', placeholder: 'https://yourchurch.com', icon: Globe },
  { value: 'email', label: 'Email', placeholder: 'info@yourchurch.com', icon: Mail },
]

interface SortableSocialLinkProps {
  id: string
  link: SocialLink
  index: number
  onUpdate: (index: number, field: keyof SocialLink, value: string) => void
  onRemove: (index: number) => void
}

function SortableSocialLink({ id, link, index, onUpdate, onRemove }: SortableSocialLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPlaceholder = (platform: SocialPlatform) => {
    return PLATFORMS.find(p => p.value === platform)?.placeholder || ''
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2',
        isDragging && 'opacity-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <Select
        value={link.platform}
        onValueChange={(value) => onUpdate(index, 'platform', value)}
      >
        <SelectTrigger className="w-32 !border !border-black dark:!border-white text-xs h-8">
          <SelectValue>
            {(() => {
              const platform = PLATFORMS.find(p => p.value === link.platform)
              if (!platform) return null
              const Icon = platform.icon
              return (
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {platform.label}
                </span>
              )
            })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="border border-black dark:border-zinc-700">
          {PLATFORMS.map(platform => {
            const Icon = platform.icon
            return (
              <SelectItem key={platform.value} value={platform.value}>
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {platform.label}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <Input
        value={link.url}
        onChange={(e) => onUpdate(index, 'url', e.target.value)}
        placeholder={getPlaceholder(link.platform)}
        className="flex-1 h-8 text-xs"
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="text-destructive hover:text-destructive h-8 w-8 flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export const SocialLinksEditor = memo(function SocialLinksEditor({
  links,
  onChange,
}: SocialLinksEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const addLink = () => {
    onChange([...links, { platform: 'instagram', url: '' }])
  }

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    onChange(newLinks)
  }

  const removeLink = (index: number) => {
    onChange(links.filter((_, i) => i !== index))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((_, i) => `social-${i}` === active.id)
      const newIndex = links.findIndex((_, i) => `social-${i}` === over.id)
      onChange(arrayMove(links, oldIndex, newIndex))
    }
  }

  // Generate stable IDs for sortable items
  const itemIds = links.map((_, index) => `social-${index}`)

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {links.map((link, index) => (
            <SortableSocialLink
              key={`social-${index}`}
              id={`social-${index}`}
              link={link}
              index={index}
              onUpdate={updateLink}
              onRemove={removeLink}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        size="sm"
        onClick={addLink}
        className="!border !border-black dark:!border-white text-xs h-8"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Social Link
      </Button>
    </div>
  )
})
