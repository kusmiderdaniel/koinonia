'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ListMusic, Star } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ArrangementDialog } from './ArrangementDialog'
import { deleteSongArrangement } from '../../actions/song-arrangements'
import {
  SECTION_TYPE_COLORS,
  type SongSection,
  type SongArrangement,
  type SectionType,
} from '../../types'

interface ArrangementsListProps {
  songId: string
  sections: SongSection[]
  arrangements: SongArrangement[]
  canManage: boolean
  onArrangementUpdated: () => void
}

export function ArrangementsList({
  songId,
  sections,
  arrangements,
  canManage,
  onArrangementUpdated,
}: ArrangementsListProps) {
  const t = useTranslations('songs')
  const isMobile = useIsMobile()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingArrangement, setEditingArrangement] = useState<SongArrangement | null>(null)
  const [deletingArrangement, setDeletingArrangement] = useState<SongArrangement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingArrangement) return

    setIsDeleting(true)
    const result = await deleteSongArrangement(deletingArrangement.id)

    if (!result.error) {
      onArrangementUpdated()
    }

    setIsDeleting(false)
    setDeletingArrangement(null)
  }

  const handleCreated = () => {
    setIsCreateDialogOpen(false)
    onArrangementUpdated()
  }

  const handleUpdated = () => {
    setEditingArrangement(null)
    onArrangementUpdated()
  }

  // Helper to get section info for an arrangement (label + color)
  const getArrangementSections = (arrangement: SongArrangement) => {
    const arrangementSections = arrangement.sections || []

    return arrangementSections
      .map((as) => {
        const section = sections.find((s) => s.id === as.section_id)
        if (!section) return null

        const baseLabel = t(`sectionTypes.${section.section_type}`)
        const typesWithNumbers = ['VERSE', 'BRIDGE', 'INTERLUDE']
        const showNumber = typesWithNumbers.includes(section.section_type) && section.section_number > 0
        const label = section.label || (showNumber ? `${baseLabel} ${section.section_number}` : baseLabel)

        return {
          label,
          color: SECTION_TYPE_COLORS[section.section_type],
          type: section.section_type,
        }
      })
      .filter(Boolean) as { label: string; color: string; type: SectionType }[]
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-medium text-muted-foreground flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <ListMusic className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          {t('arrangements.title')}
        </h3>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className={`!border !border-black/20 dark:!border-white/20 ${isMobile ? 'text-xs h-7' : ''}`}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className={isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} />
            {isMobile ? t('arrangements.new') : t('arrangements.newArrangement')}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {arrangements.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-black/20 dark:border-white/20 rounded-lg">
            {t('arrangements.noArrangementsYet')}
          </p>
        ) : (
          arrangements.map((arrangement) => {
            const arrangementSections = getArrangementSections(arrangement)

            return (
              <div
                key={arrangement.id}
                className={`group flex items-start justify-between border border-black/20 dark:border-white/20 rounded-lg hover:border-muted-foreground/50 transition-colors ${isMobile ? 'p-2' : 'p-3'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{arrangement.name}</span>
                    {arrangement.is_default && (
                      <Badge variant="outline" className={`gap-1 ${isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
                        <Star className={isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                        {t('arrangements.default')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {arrangementSections.map((section, index) => (
                      <Badge
                        key={index}
                        className={`text-white rounded-full ${isMobile ? 'text-[10px] px-2' : 'text-xs px-2.5'}`}
                        style={{ backgroundColor: section.color }}
                      >
                        {section.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {canManage && (
                  <div className={`flex items-center gap-1 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-muted-foreground hover:text-foreground ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                      onClick={() => setEditingArrangement(arrangement)}
                    >
                      <Pencil className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
                    </Button>
                    {/* Don't allow deleting the default (Master) arrangement */}
                    {!arrangement.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`text-muted-foreground hover:text-red-600 hover:bg-red-50 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`}
                        onClick={() => setDeletingArrangement(arrangement)}
                      >
                        <Trash2 className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Create Dialog */}
      <ArrangementDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        songId={songId}
        sections={sections}
        onSuccess={handleCreated}
      />

      {/* Edit Dialog */}
      {editingArrangement && (
        <ArrangementDialog
          open={true}
          onOpenChange={(open) => !open && setEditingArrangement(null)}
          songId={songId}
          sections={sections}
          arrangement={editingArrangement}
          onSuccess={handleUpdated}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingArrangement}
        onOpenChange={(open) => !open && setDeletingArrangement(null)}
        title={t('arrangements.deleteTitle')}
        description={t('arrangements.deleteDescription', { name: deletingArrangement?.name ?? '' })}
        confirmLabel={t('actions.delete')}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        destructive
      />
    </div>
  )
}
