'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
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
  onAddField: (type: FieldType, defaultLabel: string) => void
}

interface FieldTypeConfig {
  type: FieldType
  icon: LucideIcon
}

const FIELD_TYPES: FieldTypeConfig[] = [
  { type: 'text', icon: Type },
  { type: 'textarea', icon: AlignLeft },
  { type: 'number', icon: Hash },
  { type: 'email', icon: Mail },
  { type: 'date', icon: Calendar },
  { type: 'single_select', icon: ChevronDown },
  { type: 'multi_select', icon: CheckSquare },
  { type: 'checkbox', icon: Square },
]

interface DraggableFieldTypeProps {
  config: FieldTypeConfig
  onAddField: (type: FieldType, defaultLabel: string) => void
  label: string
  description: string
  defaultLabel: string
}

const DraggableFieldType = memo(function DraggableFieldType({
  config,
  onAddField,
  label,
  description,
  defaultLabel,
}: DraggableFieldTypeProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${config.type}`,
    data: { defaultLabel },
  })

  const Icon = config.icon

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onAddField(config.type, defaultLabel)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-zinc-900 hover:border-brand hover:shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="p-2 rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
})

export const FieldPalette = memo(function FieldPalette({ onAddField }: FieldPaletteProps) {
  const t = useTranslations('forms')

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">{t('palette.title')}</h3>
      <div className="space-y-2">
        {FIELD_TYPES.map((config) => (
          <DraggableFieldType
            key={config.type}
            config={config}
            onAddField={onAddField}
            label={t(`fieldTypes.${config.type}`)}
            description={t(`fieldTypes.${config.type}Desc`)}
            defaultLabel={t(`defaultLabels.${config.type}`)}
          />
        ))}
      </div>
    </div>
  )
})
