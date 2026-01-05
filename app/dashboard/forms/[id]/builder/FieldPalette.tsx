'use client'

import { memo } from 'react'
import { useDraggable } from '@dnd-kit/core'
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Calendar,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react'
import type { FieldType } from '@/lib/validations/forms'
import type { LucideIcon } from 'lucide-react'

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void
}

interface FieldTypeConfig {
  type: FieldType
  label: string
  icon: LucideIcon
  description: string
}

const FIELD_TYPES: FieldTypeConfig[] = [
  { type: 'text', label: 'Short Text', icon: Type, description: 'Single line text' },
  { type: 'textarea', label: 'Long Text', icon: AlignLeft, description: 'Multi-line text' },
  { type: 'number', label: 'Number', icon: Hash, description: 'Numeric input' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Email address' },
  { type: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { type: 'single_select', label: 'Dropdown', icon: ChevronDown, description: 'Single choice' },
  { type: 'multi_select', label: 'Checkboxes', icon: CheckSquare, description: 'Multiple choices' },
  { type: 'checkbox', label: 'Yes/No', icon: Square, description: 'Toggle checkbox' },
]

interface DraggableFieldTypeProps {
  config: FieldTypeConfig
  onAddField: (type: FieldType) => void
}

const DraggableFieldType = memo(function DraggableFieldType({
  config,
  onAddField,
}: DraggableFieldTypeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${config.type}`,
  })

  const Icon = config.icon

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAddField(config.type)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-zinc-900 hover:border-brand hover:shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="p-2 rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
    </button>
  )
})

export const FieldPalette = memo(function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">Add Fields</h3>
      <div className="space-y-2">
        {FIELD_TYPES.map((config) => (
          <DraggableFieldType key={config.type} config={config} onAddField={onAddField} />
        ))}
      </div>
    </div>
  )
})
