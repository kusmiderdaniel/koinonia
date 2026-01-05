'use client'

import { useCallback } from 'react'
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
import { useState } from 'react'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { FieldPalette } from './FieldPalette'
import { SortableField } from './SortableField'
import { FieldEditor } from './FieldEditor'
import { EmptyState } from '@/components/EmptyState'
import { FileText } from 'lucide-react'
import type { FieldType } from '@/lib/validations/forms'
import type { BuilderField } from '../../types'

export function FormBuilder() {
  const { fields, selectedFieldId, addField, reorderFields, selectField } = useFormBuilder()
  const [activeId, setActiveId] = useState<string | null>(null)

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
        // Find the index to insert at
        const overIndex = fields.findIndex((f) => f.id === over.id)
        const insertIndex = overIndex >= 0 ? overIndex : fields.length
        addField(fieldType, insertIndex)
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
    (type: FieldType) => {
      addField(type)
    },
    [addField]
  )

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null

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
                title="Start building your form"
                description="Drag fields from the left panel or click to add them to your form."
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
