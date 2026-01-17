'use client'

import { useState } from 'react'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Settings2, GripVertical, Plus, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CustomFieldDefinitionForm } from './CustomFieldDefinitionForm'
import { deleteCustomFieldDefinition, reorderCustomFields } from './actions'
import type { CustomFieldDefinition, CustomFieldType } from '@/types/custom-fields'

// Badge variants for field types
const FIELD_TYPE_COLORS: Record<CustomFieldType, string> = {
  text: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  date: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  select: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  multiselect: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  checkbox: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  number: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
}

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  date: 'Date',
  select: 'Select',
  multiselect: 'Multi-select',
  checkbox: 'Checkbox',
  number: 'Number',
}

interface SortableFieldItemProps {
  field: CustomFieldDefinition
  onEdit: (field: CustomFieldDefinition) => void
  onDelete: (field: CustomFieldDefinition) => void
}

function SortableFieldItem({ field, onEdit, onDelete }: SortableFieldItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-background ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{field.name}</span>
          <Badge variant="secondary" className={`text-xs ${FIELD_TYPE_COLORS[field.field_type]}`}>
            {FIELD_TYPE_LABELS[field.field_type]}
          </Badge>
        </div>
        {field.description && (
          <p className="text-sm text-muted-foreground truncate">{field.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(field)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(field)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface CustomFieldsManagerProps {
  initialFields: CustomFieldDefinition[]
}

export function CustomFieldsManager({ initialFields }: CustomFieldsManagerProps) {
  const t = useTranslations('people.customFields')
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<CustomFieldDefinition[]>(initialFields)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDefinition | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      const newOrder = arrayMove(fields, oldIndex, newIndex)
      setFields(newOrder)

      // Save to database
      const result = await reorderCustomFields(newOrder.map((f) => f.id))
      if (result.error) {
        // Revert on error
        setFields(fields)
        toast.error(result.error)
      }
    }
  }

  const handleAddField = (field: CustomFieldDefinition) => {
    setFields([...fields, field])
    setShowAddDialog(false)
  }

  const handleEditField = (updatedField: CustomFieldDefinition) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)))
    setEditingField(null)
  }

  const handleDeleteConfirm = async () => {
    if (!fieldToDelete) return

    setIsDeleting(true)
    const result = await deleteCustomFieldDefinition(fieldToDelete.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setFields(fields.filter((f) => f.id !== fieldToDelete.id))
      toast.success(t('fieldDeleted'))
    }
    setFieldToDelete(null)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 justify-center !border !border-black/20 dark:!border-white/20"
          >
            <Settings2 className="h-4 w-4" />
            {t('manageFields')}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-zinc-950">
          <SheetHeader>
            <SheetTitle>{t('title')}</SheetTitle>
            <SheetDescription>{t('description')}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 px-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noFields')}</p>
                <p className="text-sm mt-1">{t('noFieldsHint')}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        onEdit={setEditingField}
                        onDelete={setFieldToDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <Button
              variant="outline"
              className="w-full gap-2 !border !border-dashed !border-black/20 dark:!border-white/20"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4" />
              {t('addField')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Field Dialog */}
      <CustomFieldDefinitionForm
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddField}
      />

      {/* Edit Field Dialog */}
      <CustomFieldDefinitionForm
        open={!!editingField}
        onOpenChange={(open) => !open && setEditingField(null)}
        editingField={editingField}
        onSuccess={handleEditField}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!fieldToDelete}
        onOpenChange={(open) => !open && setFieldToDelete(null)}
        title={t('deleteTitle')}
        description={t('deleteDescription', { name: fieldToDelete?.name ?? '' })}
        confirmLabel={t('deleteConfirm')}
        destructive
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  )
}
