'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  GripVertical,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { deleteSongSection } from '../../actions/song-sections'
import { SECTION_TYPE_COLORS, type SongSection } from '../../types'

interface SortableSectionItemProps {
  section: SongSection
  index: number
  totalSections: number
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  onReorder: (newIndex: number) => void
}

export const SortableSectionItem = memo(function SortableSectionItem({
  section,
  index,
  totalSections,
  canManage,
  onEdit,
  onDelete,
  onReorder,
}: SortableSectionItemProps) {
  const t = useTranslations('songs')
  const isMobile = useIsMobile()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: !canManage })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const canMoveUp = index > 0
  const canMoveDown = index < totalSections - 1

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canMoveUp) {
      onReorder(index - 1)
    }
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (canMoveDown) {
      onReorder(index + 1)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteSongSection(section.id)
    if (!result.error) {
      onDelete()
    }
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  // Get display label
  const baseLabel = t(`sectionTypes.${section.section_type}`)
  const typesWithNumbers = ['VERSE', 'BRIDGE', 'INTERLUDE']
  const showNumber = typesWithNumbers.includes(section.section_type) && section.section_number > 0
  const displayLabel = section.label || (showNumber ? `${baseLabel} ${section.section_number}` : baseLabel)


  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative bg-white dark:bg-zinc-900 border border-black/20 dark:border-white/20 rounded-lg transition-all ${
          isMobile ? 'p-3' : 'p-4'
        } ${isDragging ? 'opacity-50 shadow-lg z-50' : ''} ${
          canManage ? 'hover:border-muted-foreground/50' : ''
        }`}
      >
        {/* Drag Handle - Desktop only */}
        {canManage && !isMobile && (
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        {/* Mobile Reorder Buttons */}
        {canManage && isMobile && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={handleMoveUp}
              disabled={!canMoveUp}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              onClick={handleMoveDown}
              disabled={!canMoveDown}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {canManage && (
          <div
            className={`absolute right-2 top-2 flex items-center gap-1 ${
              isMobile ? '' : 'opacity-0 group-hover:opacity-100'
            } transition-opacity`}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-foreground hover:bg-muted ${
                isMobile ? 'h-6 w-6' : 'h-7 w-7'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`text-muted-foreground hover:text-red-600 hover:bg-red-50 ${
                isMobile ? 'h-6 w-6' : 'h-7 w-7'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(true)
              }}
            >
              <Trash2 className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            </Button>
          </div>
        )}

        {/* Section Content */}
        <div className={isMobile ? 'pl-7 pr-6' : canManage ? 'pl-6 pr-8' : ''}>
          <div className="flex items-center gap-2 mb-2">
            <Badge
              className="text-xs text-white rounded-full px-2.5"
              style={{ backgroundColor: SECTION_TYPE_COLORS[section.section_type] }}
            >
              {displayLabel}
            </Badge>
          </div>

          {/* Lyrics */}
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {section.lyrics}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('deleteSectionDialog.title')}
        description={t('deleteSectionDialog.description', { label: displayLabel })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        destructive
      />
    </>
  )
})
