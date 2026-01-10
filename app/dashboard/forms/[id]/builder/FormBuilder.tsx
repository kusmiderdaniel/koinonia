'use client'

import { useCallback, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { FieldPalette } from './FieldPalette'
import { SortableField } from './SortableField'
import { FieldEditor } from './FieldEditor'
import { EmptyState } from '@/components/EmptyState'
import { useIsMobile } from '@/lib/hooks'
import { FileText, Plus } from 'lucide-react'
import type { FieldType } from '@/lib/validations/forms'
import type { BuilderField } from '../../types'

export function FormBuilder() {
  const t = useTranslations('forms')
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const { fields, selectedFieldId, addField, reorderFields, selectField } = useFormBuilder()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)

  // Prevent hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true)
  }, [])

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over) return

      // Check if dragging from palette (new field)
      if (typeof active.id === 'string' && active.id.startsWith('palette-')) {
        const fieldType = active.id.replace('palette-', '') as FieldType
        // Get the translated default label from drag data
        const defaultLabel = (active.data.current as { defaultLabel?: string })?.defaultLabel
        // Find the index to insert at
        const overIndex = fields.findIndex((f) => f.id === over.id)
        const insertIndex = overIndex >= 0 ? overIndex : fields.length
        addField(fieldType, defaultLabel, insertIndex)
        return
      }

      // Reordering existing fields
      if (active.id !== over.id) {
        reorderFields(active.id as string, over.id as string)
      }
    },
    [fields, addField, reorderFields]
  )

  const handleAddField = useCallback(
    (type: FieldType, defaultLabel: string) => {
      addField(type, defaultLabel)
      if (isMobile) {
        setIsPaletteOpen(false)
      }
    },
    [addField, isMobile]
  )

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null

  // Show loading skeleton until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-full">
        <div className="w-64 border-r bg-muted/30 p-4 space-y-2">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="flex-1 p-6 bg-muted/10">
          <div className="max-w-2xl mx-auto space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="w-80 border-l p-4">
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    )
  }

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <div className="flex flex-col h-full">
          {/* Mobile Canvas */}
          <div className="flex-1 overflow-y-auto p-3 bg-muted/10">
            {fields.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('builder.empty.title')}
                description={t('builder.empty.descriptionMobile')}
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    isSelected={selectedFieldId === field.id}
                    onClick={() => selectField(field.id)}
                    index={index}
                    totalFields={fields.length}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile Add Field Button */}
          <div className="shrink-0 p-3 border-t bg-background">
            <Button
              variant="outline"
              className="w-full !border !border-black dark:!border-white"
              onClick={() => setIsPaletteOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('builder.addField')}
            </Button>
          </div>
        </div>

        {/* Field Palette Sheet */}
        <Sheet open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
          <SheetContent side="bottom" className="h-[70vh] bg-white dark:bg-zinc-950">
            <SheetHeader>
              <SheetTitle>{t('builder.addField')}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto mt-4">
              <FieldPalette onAddField={handleAddField} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Field Editor Sheet */}
        <Sheet open={!!selectedFieldId} onOpenChange={(open) => !open && selectField(null)}>
          <SheetContent side="bottom" className="h-[70vh] bg-white dark:bg-zinc-950 px-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('builder.editField')}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-full">
              <FieldEditor />
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Desktop layout
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full">
        {/* Field Palette */}
        <div className="w-64 border-r bg-muted/30 overflow-y-auto">
          <FieldPalette onAddField={handleAddField} />
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <div className="max-w-2xl mx-auto">
            {fields.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('builder.empty.title')}
                description={t('builder.empty.descriptionDesktop')}
              />
            ) : (
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {fields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      isSelected={selectedFieldId === field.id}
                      onClick={() => selectField(field.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>

        {/* Field Editor */}
        <div className="w-80 border-l bg-background overflow-y-auto">
          <FieldEditor />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeField ? (
          <div className="bg-white dark:bg-zinc-900 border rounded-lg p-4 shadow-lg opacity-80">
            <span className="font-medium">{activeField.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
