'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import {
  GripVertical,
  Trash2,
  Copy,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Calendar,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import type { BuilderField } from '../../types'
import type { FieldType } from '@/lib/validations/forms'
import type { LucideIcon } from 'lucide-react'

interface SortableFieldProps {
  field: BuilderField
  isSelected: boolean
  onClick: () => void
}

const FIELD_ICONS: Record<FieldType, LucideIcon> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  email: Mail,
  date: Calendar,
  single_select: ChevronDown,
  multi_select: CheckSquare,
  checkbox: Square,
}

const FIELD_LABELS: Record<FieldType, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  number: 'Number',
  email: 'Email',
  date: 'Date',
  single_select: 'Dropdown',
  multi_select: 'Checkboxes',
  checkbox: 'Yes/No',
}

export const SortableField = memo(function SortableField({
  field,
  isSelected,
  onClick,
}: SortableFieldProps) {
  const { deleteField, duplicateField } = useFormBuilder()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = FIELD_ICONS[field.type] || Type

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteField(field.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateField(field.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-zinc-900 border rounded-lg p-4 cursor-pointer transition-all ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      } ${
        isSelected
          ? 'ring-2 ring-brand border-brand'
          : 'hover:border-muted-foreground/50'
      }`}
      onClick={onClick}
    >
      {/* Drag Handle */}
      <button
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Action Buttons */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={handleDuplicate}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Field Content */}
      <div className="pl-6 pr-8">
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{field.label || FIELD_LABELS[field.type]}</span>
          {field.required && (
            <span className="text-brand font-bold">*</span>
          )}
        </div>

        {/* Description */}
        {field.description && (
          <p className="text-xs text-muted-foreground mt-1 pl-[22px]">{field.description}</p>
        )}

        {/* Field Preview */}
        <div className="mt-2">
          {field.type === 'text' && (
            <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              {field.placeholder || 'Short answer text'}
            </div>
          )}
          {field.type === 'textarea' && (
            <div className="h-20 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {field.placeholder || 'Long answer text'}
            </div>
          )}
          {field.type === 'number' && (
            <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              {field.placeholder || '0'}
            </div>
          )}
          {field.type === 'email' && (
            <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              {field.placeholder || 'email@example.com'}
            </div>
          )}
          {field.type === 'date' && (
            <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Pick a date
            </div>
          )}
          {field.type === 'single_select' && (
            <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Select an option</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
          {field.type === 'multi_select' && field.options && (
            <div className="space-y-2">
              {field.options.slice(0, 3).map((opt) => (
                <div key={opt.value} className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded border bg-muted/50" />
                  <span>{opt.label}</span>
                </div>
              ))}
              {field.options.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{field.options.length - 3} more options
                </p>
              )}
            </div>
          )}
          {field.type === 'checkbox' && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-5 w-5 rounded border bg-muted/50" />
              <span className="text-muted-foreground">Yes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
