'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GripVertical, X } from 'lucide-react'
import { createSongArrangement, updateSongArrangement } from '../../actions/song-arrangements'
import {
  SECTION_TYPE_COLORS,
  type SongSection,
  type SongArrangement,
} from '../../types'
import { formatDurationInputs } from '@/lib/utils/format'

interface ArrangementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  songId: string
  sections: SongSection[]
  arrangement?: SongArrangement
  onSuccess: () => void
}

// Each item in the arrangement has a unique ID but references a section
interface ArrangementItem {
  id: string // Unique ID for this instance
  sectionId: string // Reference to the actual section
}

// Sortable section item in the arrangement order
function SortableArrangementItem({
  item,
  section,
  label,
  onRemove,
}: {
  item: ArrangementItem
  section: SongSection
  label: string
  onRemove: () => void
}) {
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

  const color = SECTION_TYPE_COLORS[section.section_type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1 px-2 bg-muted rounded-md ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Badge
        className="text-xs text-white flex-1 justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        {label}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-red-600"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

export function ArrangementDialog({
  open,
  onOpenChange,
  songId,
  sections,
  arrangement,
  onSuccess,
}: ArrangementDialogProps) {
  const t = useTranslations('songs')
  const isEditing = !!arrangement

  // Helper to get section display label
  const getSectionLabel = (section: SongSection): string => {
    if (section.label) return section.label
    const baseLabel = t(`sectionTypes.${section.section_type}`)
    const typesWithNumbers = ['VERSE', 'BRIDGE', 'INTERLUDE']
    const showNumber = typesWithNumbers.includes(section.section_type) && section.section_number > 0
    return showNumber ? `${baseLabel} ${section.section_number}` : baseLabel
  }

  const [name, setName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [arrangementItems, setArrangementItems] = useState<ArrangementItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Generate unique ID for arrangement items
  const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (arrangement) {
        setName(arrangement.name)
        // Set duration if present
        if (arrangement.duration_seconds) {
          const { minutes, seconds } = formatDurationInputs(arrangement.duration_seconds)
          setDurationMinutes(minutes)
          setDurationSeconds(seconds)
        } else {
          setDurationMinutes('')
          setDurationSeconds('')
        }
        // Convert arrangement sections to items with unique IDs
        const items = (arrangement.sections || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((as) => ({
            id: as.id, // Use existing ID when editing
            sectionId: as.section_id,
          }))
        setArrangementItems(items)
      } else {
        setName('')
        setDurationMinutes('')
        setDurationSeconds('')
        setArrangementItems([])
      }
      setError(null)
    }
  }, [open, arrangement])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setArrangementItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = [...items]
        const [removed] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, removed)

        return newItems
      })
    }
  }, [])

  // Add section to arrangement (can be added multiple times)
  const handleAddSection = (sectionId: string) => {
    setArrangementItems((items) => [
      ...items,
      { id: generateItemId(), sectionId },
    ])
  }

  // Remove specific item from arrangement
  const handleRemoveItem = (itemId: string) => {
    setArrangementItems((items) => items.filter((item) => item.id !== itemId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError(t('arrangementDialog.nameRequired'))
      return
    }

    if (arrangementItems.length === 0) {
      setError(t('arrangementDialog.sectionsRequired'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Calculate duration in seconds if provided
    const mins = parseInt(durationMinutes, 10) || 0
    const secs = parseInt(durationSeconds, 10) || 0
    const totalSeconds = mins * 60 + secs

    // Convert items to section IDs array (preserving order and duplicates)
    const data = {
      name: name.trim(),
      sectionIds: arrangementItems.map((item) => item.sectionId),
      durationSeconds: totalSeconds > 0 ? totalSeconds : null,
    }

    const result = isEditing
      ? await updateSongArrangement(arrangement.id, data)
      : await createSongArrangement(songId, data)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onSuccess()
  }

  // Get section by ID helper
  const getSectionById = (sectionId: string) => sections.find((s) => s.id === sectionId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('arrangementDialog.editTitle') : t('arrangementDialog.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">{t('arrangementDialog.nameLabel')}</Label>
            <Input
              id="name"
              placeholder={t('arrangementDialog.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Duration (optional) */}
          <div className="space-y-1">
            <Label>
              {t('arrangementDialog.durationLabel')}{' '}
              <span className="text-muted-foreground font-normal text-xs">
                {t('arrangementDialog.durationHint')}
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="MM"
                value={durationMinutes}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  if (val.length <= 2) setDurationMinutes(val)
                }}
                className="w-16 text-center"
              />
              <span className="text-lg font-medium text-muted-foreground">:</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="SS"
                value={durationSeconds}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  if (val.length <= 2 && (parseInt(val, 10) || 0) < 60) {
                    setDurationSeconds(val)
                  }
                }}
                className="w-16 text-center"
              />
              <span className="text-sm text-muted-foreground">(MM:SS)</span>
            </div>
          </div>

          {/* Section Palette - Click to add */}
          <div className="space-y-1">
            <Label>
              {t('arrangementDialog.sectionsLabel')}{' '}
              <span className="text-muted-foreground font-normal text-xs">
                {t('arrangementDialog.sectionsHint')}
              </span>
            </Label>
            <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
              {sections.map((section) => (
                <Badge
                  key={section.id}
                  className="text-xs text-white cursor-pointer hover:opacity-80 transition-opacity rounded-full px-2.5"
                  style={{ backgroundColor: SECTION_TYPE_COLORS[section.section_type] }}
                  onClick={() => handleAddSection(section.id)}
                >
                  {getSectionLabel(section)}
                </Badge>
              ))}
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('arrangementDialog.noSectionsAvailable')}
                </p>
              )}
            </div>
          </div>

          {/* Arrangement Order (Reorderable) */}
          <div className="space-y-1">
            <Label>
              {t('arrangementDialog.orderLabel')}{' '}
              <span className="text-muted-foreground font-normal text-xs">
                {t('arrangementDialog.orderHint')}
              </span>
            </Label>
            <ScrollArea className="border rounded-md p-2 h-[250px]">
              {arrangementItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('arrangementDialog.emptyOrder')}
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={arrangementItems.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0.5">
                      {arrangementItems.map((item) => {
                        const section = getSectionById(item.sectionId)
                        if (!section) return null
                        return (
                          <SortableArrangementItem
                            key={item.id}
                            item={item}
                            section={section}
                            label={getSectionLabel(section)}
                            onRemove={() => handleRemoveItem(item.id)}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </ScrollArea>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="gap-2 pt-2 pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="!border !border-black dark:!border-white"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="!bg-brand hover:!bg-brand/90 !text-white !border-0"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditing
                  ? t('arrangementDialog.saving')
                  : t('arrangementDialog.creating')
                : isEditing
                  ? t('arrangementDialog.save')
                  : t('arrangementDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
