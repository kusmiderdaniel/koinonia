'use client'

import { useState, useCallback, useMemo } from 'react'
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
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, FileText } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
import { EmptyState } from '@/components/EmptyState'
import { SortableSectionItem } from './SortableSectionItem'
import { SectionDialog } from './SectionDialog'
import { ImportLyricsDialog } from './ImportLyricsDialog'
import { reorderSongSections } from '../../actions/song-sections'
import type { Song, SongSection } from '../../types'

interface SongLyricsTabProps {
  song: Song
  canManage: boolean
  onSongUpdated: () => void
}

export function SongLyricsTab({ song, canManage, onSongUpdated }: SongLyricsTabProps) {
  const isMobile = useIsMobile()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<SongSection | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const [selectedView, setSelectedView] = useState<string>('sections') // 'sections' or arrangement id

  const sections = song.song_sections || []
  const arrangements = song.song_arrangements || []

  // Get displayed sections based on selected view
  const displayedSections = useMemo(() => {
    if (selectedView === 'sections') {
      return sections
    }

    // Find the selected arrangement
    const arrangement = arrangements.find((a) => a.id === selectedView)
    if (!arrangement || !arrangement.sections) {
      return sections
    }

    // Return sections in arrangement order (can include duplicates)
    return arrangement.sections
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((as) => sections.find((s) => s.id === as.section_id))
      .filter(Boolean) as SongSection[]
  }, [selectedView, sections, arrangements])

  // Whether we're viewing an arrangement (disables editing/reordering)
  const isViewingArrangement = selectedView !== 'sections'

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (over && active.id !== over.id) {
        setIsReordering(true)

        const oldIndex = sections.findIndex((s) => s.id === active.id)
        const newIndex = sections.findIndex((s) => s.id === over.id)

        // Create new order
        const newSections = [...sections]
        const [removed] = newSections.splice(oldIndex, 1)
        newSections.splice(newIndex, 0, removed)

        const newOrder = newSections.map((s) => s.id)

        const result = await reorderSongSections(song.id, newOrder)

        if (!result.error) {
          onSongUpdated()
        }

        setIsReordering(false)
      }
    },
    [sections, song.id, onSongUpdated]
  )

  const handleSectionCreated = useCallback(() => {
    setIsCreateDialogOpen(false)
    onSongUpdated()
  }, [onSongUpdated])

  const handleSectionUpdated = useCallback(() => {
    setEditingSection(null)
    onSongUpdated()
  }, [onSongUpdated])

  const handleSectionDeleted = useCallback(() => {
    onSongUpdated()
  }, [onSongUpdated])

  const handleImportComplete = useCallback(() => {
    setIsImportDialogOpen(false)
    onSongUpdated()
  }, [onSongUpdated])

  return (
    <div className="space-y-4">
      {/* View Selector */}
      {sections.length > 0 && (
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>View:</span>
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className={`h-8 ${isMobile ? 'w-[140px] text-xs' : 'w-[180px] text-sm'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-black dark:border-white">
                <SelectItem value="sections">All Sections</SelectItem>
                {arrangements.map((arr) => (
                  <SelectItem key={arr.id} value={arr.id}>
                    {arr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canManage && !isViewingArrangement && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`!border !border-black dark:!border-white ${isMobile ? 'text-xs h-7' : ''}`}
                onClick={() => setIsImportDialogOpen(true)}
              >
                <FileText className={isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`!border !border-black dark:!border-white ${isMobile ? 'text-xs h-7' : ''}`}
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className={isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} />
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      <div>

        {sections.length === 0 ? (
          <div className="border rounded-lg p-6">
            <EmptyState
              icon={FileText}
              title="No lyrics yet"
              description={
                canManage
                  ? 'Add song sections to store lyrics'
                  : 'No lyrics have been added to this song'
              }
              size="sm"
            />
            {canManage && (
              <div className="flex justify-center gap-3 mt-4">
                <Button
                  variant="outline"
                  className="!border !border-black dark:!border-white"
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Import Lyrics
                </Button>
                <Button
                  className="!bg-brand hover:!bg-brand/90 !text-white !border-0"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            )}
          </div>
        ) : isViewingArrangement ? (
          // View-only mode for arrangements (no drag-drop, no edit)
          <div className="space-y-2">
            {displayedSections.map((section, index) => (
              <SortableSectionItem
                key={`${section.id}-${index}`}
                section={section}
                index={index}
                totalSections={displayedSections.length}
                canManage={false}
                onEdit={() => {}}
                onDelete={() => {}}
                onReorder={() => {}}
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className={`space-y-2 ${isReordering ? 'opacity-50' : ''}`}>
                {sections.map((section, index) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    index={index}
                    totalSections={sections.length}
                    canManage={canManage}
                    onEdit={() => setEditingSection(section)}
                    onDelete={handleSectionDeleted}
                    onReorder={(newIndex) => {
                      // Handle mobile reorder
                      const newSections = [...sections]
                      const [removed] = newSections.splice(index, 1)
                      newSections.splice(newIndex, 0, removed)
                      const newOrder = newSections.map((s) => s.id)
                      reorderSongSections(song.id, newOrder).then(() => {
                        onSongUpdated()
                      })
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Create Section Dialog */}
      <SectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        songId={song.id}
        onSuccess={handleSectionCreated}
      />

      {/* Edit Section Dialog */}
      {editingSection && (
        <SectionDialog
          open={true}
          onOpenChange={(open) => !open && setEditingSection(null)}
          songId={song.id}
          section={editingSection}
          onSuccess={handleSectionUpdated}
        />
      )}

      {/* Import Lyrics Dialog */}
      <ImportLyricsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        songId={song.id}
        onSuccess={handleImportComplete}
      />
    </div>
  )
}
