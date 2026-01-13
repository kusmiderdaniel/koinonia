'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, GripVertical, Palette } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { optionColors } from '@/lib/validations/forms'
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
import { createCustomFieldDefinition, updateCustomFieldDefinition } from './actions'
import type {
  CustomFieldDefinition,
  CustomFieldType,
  SelectOption,
  NumberSettings,
} from '@/types/custom-fields'

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Single Select' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Number' },
]

const NUMBER_FORMATS: { value: NumberSettings['format']; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
]

interface SortableOptionProps {
  option: SelectOption
  index: number
  onUpdate: (index: number, option: SelectOption) => void
  onRemove: (index: number) => void
}

function SortableOption({ option, index, onUpdate, onRemove }: SortableOptionProps) {
  const [openColorPicker, setOpenColorPicker] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `option-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const selectedColor = optionColors.find((c) => c.name === option.color)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Popover open={openColorPicker} onOpenChange={setOpenColorPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 !border !border-black dark:!border-white"
          >
            {selectedColor ? (
              <div className={`h-4 w-4 rounded-full ${selectedColor.bg}`} />
            ) : (
              <Palette className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto !p-2 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md"
          align="start"
        >
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => {
                onUpdate(index, { ...option, color: undefined })
                setOpenColorPicker(false)
              }}
              className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                !option.color
                  ? 'border-black dark:border-white'
                  : 'border-transparent'
              }`}
            >
              <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </button>
            {optionColors.slice(1).map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  onUpdate(index, { ...option, color: color.name })
                  setOpenColorPicker(false)
                }}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                  option.color === color.name
                    ? 'border-black dark:border-white'
                    : 'border-transparent'
                }`}
              >
                <div className={`h-4 w-4 rounded-full ${color.bg}`} />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Input
        value={option.label}
        onChange={(e) => onUpdate(index, { ...option, label: e.target.value })}
        placeholder="Option label"
        className="flex-1 h-8"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface CustomFieldDefinitionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingField?: CustomFieldDefinition | null
  onSuccess: (field: CustomFieldDefinition) => void
}

export function CustomFieldDefinitionForm({
  open,
  onOpenChange,
  editingField,
  onSuccess,
}: CustomFieldDefinitionFormProps) {
  const t = useTranslations('people.customFields')
  const tCommon = useTranslations('common.buttons')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fieldType, setFieldType] = useState<CustomFieldType>('text')
  const [defaultVisible, setDefaultVisible] = useState(true)
  const [options, setOptions] = useState<SelectOption[]>([])
  const [numberSettings, setNumberSettings] = useState<NumberSettings>({
    format: 'number',
    decimals: 0,
    prefix: '',
    suffix: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!editingField

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Reset form when dialog opens/closes or editing field changes
  useEffect(() => {
    if (open) {
      if (editingField) {
        setName(editingField.name)
        setDescription(editingField.description || '')
        setFieldType(editingField.field_type)
        setDefaultVisible(editingField.default_visible)
        setOptions(editingField.options || [])
        setNumberSettings(editingField.settings || { format: 'number', decimals: 0 })
      } else {
        setName('')
        setDescription('')
        setFieldType('text')
        setDefaultVisible(true)
        setOptions([])
        setNumberSettings({ format: 'number', decimals: 0, prefix: '', suffix: '' })
      }
    }
  }, [open, editingField])

  const handleAddOption = () => {
    const newValue = `option_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    setOptions([...options, { value: newValue, label: '' }])
  }

  const handleUpdateOption = (index: number, option: SelectOption) => {
    const newOptions = [...options]
    // Keep the unique value, don't auto-generate from label to avoid duplicates
    newOptions[index] = option
    setOptions(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(String(active.id).replace('option-', ''), 10)
      const newIndex = parseInt(String(over.id).replace('option-', ''), 10)
      if (!isNaN(oldIndex) && !isNaN(newIndex)) {
        setOptions(arrayMove(options, oldIndex, newIndex))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error(t('nameRequired'))
      return
    }

    // Validate options for select/multiselect
    if ((fieldType === 'select' || fieldType === 'multiselect') && options.length === 0) {
      toast.error(t('optionsRequired'))
      return
    }

    // Filter out empty options and ensure all have labels
    const validOptions = options.filter((o) => o.label.trim())
    if ((fieldType === 'select' || fieldType === 'multiselect') && validOptions.length === 0) {
      toast.error(t('optionsRequired'))
      return
    }

    setIsLoading(true)

    const fieldData = {
      name: name.trim(),
      description: description.trim() || null,
      options: fieldType === 'select' || fieldType === 'multiselect' ? validOptions : [],
      settings: fieldType === 'number' ? numberSettings : {},
      default_visible: defaultVisible,
    }

    const result = isEditing
      ? await updateCustomFieldDefinition(editingField.id, fieldData)
      : await createCustomFieldDefinition({ ...fieldData, field_type: fieldType })

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      toast.success(isEditing ? t('fieldUpdated') : t('fieldCreated'))
      onSuccess(result.data)
      onOpenChange(false)
    }
  }

  const showOptionsEditor = fieldType === 'select' || fieldType === 'multiselect'
  const showNumberSettings = fieldType === 'number'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('editFieldTitle') : t('addFieldTitle')}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? t('editFieldDescription') : t('addFieldDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Field Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">{t('fieldName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('fieldNamePlaceholder')}
                autoFocus
              />
            </div>

            {/* Field Type (disabled when editing) */}
            <div className="grid gap-2">
              <Label htmlFor="field-type">{t('fieldType')}</Label>
              <Select
                value={fieldType}
                onValueChange={(value) => setFieldType(value as CustomFieldType)}
                disabled={isEditing}
              >
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-black dark:border-white bg-white dark:bg-zinc-950">
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && (
                <p className="text-xs text-muted-foreground">{t('fieldTypeCannotChange')}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">{t('fieldDescription')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('fieldDescriptionPlaceholder')}
                rows={2}
              />
            </div>

            {/* Options Editor for Select/Multiselect */}
            {showOptionsEditor && (
              <div className="grid gap-2">
                <Label>{t('options')}</Label>
                <div className="space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={options.map((_, i) => `option-${i}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {options.map((option, index) => (
                        <SortableOption
                          key={`option-${index}`}
                          option={option}
                          index={index}
                          onUpdate={handleUpdateOption}
                          onRemove={handleRemoveOption}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1 !border !border-black dark:!border-zinc-700"
                    onClick={handleAddOption}
                  >
                    <Plus className="h-3 w-3" />
                    {t('addOption')}
                  </Button>
                </div>
              </div>
            )}

            {/* Number Settings */}
            {showNumberSettings && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>{t('numberFormat')}</Label>
                  <Select
                    value={numberSettings.format || 'number'}
                    onValueChange={(value) =>
                      setNumberSettings({ ...numberSettings, format: value as NumberSettings['format'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border border-black dark:border-white bg-white dark:bg-zinc-950">
                      {NUMBER_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value!}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="decimals">{t('decimalPlaces')}</Label>
                    <Input
                      id="decimals"
                      type="number"
                      min={0}
                      max={10}
                      value={numberSettings.decimals || 0}
                      onChange={(e) =>
                        setNumberSettings({ ...numberSettings, decimals: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prefix">{t('prefix')}</Label>
                    <Input
                      id="prefix"
                      value={numberSettings.prefix || ''}
                      onChange={(e) =>
                        setNumberSettings({ ...numberSettings, prefix: e.target.value })
                      }
                      placeholder="$"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="suffix">{t('suffix')}</Label>
                    <Input
                      id="suffix"
                      value={numberSettings.suffix || ''}
                      onChange={(e) =>
                        setNumberSettings({ ...numberSettings, suffix: e.target.value })
                      }
                      placeholder="%"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="min">{t('minValue')}</Label>
                    <Input
                      id="min"
                      type="number"
                      value={numberSettings.min ?? ''}
                      onChange={(e) =>
                        setNumberSettings({
                          ...numberSettings,
                          min: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Default Visible Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label htmlFor="default-visible" className="font-medium">
                  {t('showByDefault')}
                </Label>
                <p className="text-sm text-muted-foreground">{t('showByDefaultHint')}</p>
              </div>
              <Switch
                id="default-visible"
                checked={defaultVisible}
                onCheckedChange={setDefaultVisible}
              />
            </div>
          </div>

          <DialogFooter className="!bg-transparent !border-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white"
            >
              {isLoading ? t('saving') : isEditing ? t('saveChanges') : t('createField')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
