'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
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
  ChevronUp,
  Minus,
} from 'lucide-react'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { useIsMobile } from '@/lib/hooks'
import type { BuilderField } from '../../types'
import type { FieldType } from '@/lib/validations/forms'
import type { LucideIcon } from 'lucide-react'

interface SortableFieldProps {
  field: BuilderField
  resolvedField?: BuilderField // Field with resolved translations for display
  isSelected: boolean
  onClick: () => void
  index?: number
  totalFields?: number
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
  divider: Minus,
}

export const SortableField = memo(function SortableField({
  field,
  resolvedField,
  isSelected,
  onClick,
  index = 0,
  totalFields = 0,
}: SortableFieldProps) {
  const t = useTranslations('forms')
  const { fields, deleteField, duplicateField, reorderFields } = useFormBuilder()
  const isMobile = useIsMobile()

  // Use resolved field for display, fall back to original field
  const displayField = resolvedField || field
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

  const Icon = FIELD_ICONS[field.type as FieldType] || Type

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteField(field.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateField(field.id)
  }

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (index > 0) {
      const prevField = fields[index - 1]
      reorderFields(field.id, prevField.id)
    }
  }

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (index < fields.length - 1) {
      const nextField = fields[index + 1]
      reorderFields(field.id, nextField.id)
    }
  }

  const canMoveUp = index > 0
  const canMoveDown = index < (totalFields || fields.length) - 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-zinc-900 border border-black/20 dark:border-white/20 rounded-lg cursor-pointer transition-all ${
        isMobile ? 'p-3' : 'p-4'
      } ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      } ${
        isSelected
          ? 'ring-2 ring-brand border-brand'
          : 'hover:border-muted-foreground/50'
      }`}
      onClick={onClick}
    >
      {/* Drag Handle - Desktop only */}
      {!isMobile && (
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {/* Mobile Reorder Buttons */}
      {isMobile && (
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
      <div className={`absolute right-2 top-2 flex items-center gap-1 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleDuplicate}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`text-muted-foreground hover:text-red-600 hover:bg-red-50 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`}
          onClick={handleDelete}
        >
          <Trash2 className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </Button>
      </div>

      {/* Field Content */}
      <div className={isMobile ? 'pl-7 pr-6' : 'pl-6 pr-8'}>
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{displayField.label || t(`fieldTypes.${field.type}`)}</span>
          {field.required && (
            <span className="text-brand font-bold">*</span>
          )}
        </div>

        {/* Description */}
        {displayField.description && (
          <p className="text-xs text-muted-foreground mt-1 pl-[22px]">{displayField.description}</p>
        )}

        {/* Field Preview */}
        <div className="mt-2">
          {field.type === 'text' && (
            <div className="h-9 rounded-md border border-black/20 dark:border-white/20 bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              {displayField.placeholder || t('fieldPlaceholders.text')}
            </div>
          )}
          {field.type === 'textarea' && (
            <div className="h-20 rounded-md border border-black/20 dark:border-white/20 bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {displayField.placeholder || t('fieldPlaceholders.textarea')}
            </div>
          )}
          {field.type === 'number' && (
            <div className="h-9 rounded-md border border-black/20 dark:border-white/20 bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              {displayField.placeholder || t('fieldPlaceholders.number')}
            </div>
          )}
          {field.type === 'email' && (
            <div className="h-9 rounded-md border border-black/20 dark:border-white/20 bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              {displayField.placeholder || t('fieldPlaceholders.email')}
            </div>
          )}
          {field.type === 'date' && (
            <div className="h-9 rounded-md border border-black/20 dark:border-white/20 bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              {t('fieldPlaceholders.date')}
            </div>
          )}
          {field.type === 'single_select' && (
            <div className="h-9 rounded-md border border-black/20 dark:border-white/20 bg-muted/50 px-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('fieldPlaceholders.single_select')}</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
          {field.type === 'multi_select' && displayField.options && (
            <div className="space-y-2">
              {displayField.options.slice(0, 3).map((opt: { value: string; label: string }) => (
                <div key={opt.value} className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded border border-black/20 dark:border-white/20 bg-muted/50" />
                  <span>{opt.label}</span>
                </div>
              ))}
              {displayField.options.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  {t('fieldEditor.moreOptions', { count: displayField.options.length - 3 })}
                </p>
              )}
            </div>
          )}
          {field.type === 'checkbox' && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-5 w-5 rounded border border-black/20 dark:border-white/20 bg-muted/50" />
              <span className="text-muted-foreground">{t('fieldPlaceholders.checkbox')}</span>
            </div>
          )}
          {field.type === 'divider' && (
            <div className="flex items-center gap-2">
              {field.settings?.divider?.showTitle ? (
                <>
                  <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-6" />
                  <span className="text-xs text-muted-foreground">{displayField.label || t('fieldTypes.divider')}</span>
                  <div className="h-px bg-zinc-300 dark:bg-zinc-600 flex-1" />
                </>
              ) : (
                <div className="h-px bg-zinc-300 dark:bg-zinc-600 w-full" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
