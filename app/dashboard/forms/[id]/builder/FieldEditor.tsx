'use client'

import { memo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Trash2, GripVertical, Palette } from 'lucide-react'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { ConditionsPanel, useConditionActions } from './ConditionsPanel'
import { optionColors } from '@/lib/validations/forms'
import type { SelectOption, NumberFormat } from '@/lib/validations/forms'

const NUMBER_FORMATS: { value: NumberFormat; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency ($)' },
  { value: 'percentage', label: 'Percentage (%)' },
]

export const FieldEditor = memo(function FieldEditor() {
  const { fields, selectedFieldId, updateField, selectField } = useFormBuilder()
  const { handleAddCondition, canAddCondition } = useConditionActions()
  const [openColorPickerIndex, setOpenColorPickerIndex] = useState<number | null>(null)

  const selectedField = selectedFieldId ? fields.find((f) => f.id === selectedFieldId) : null

  const handleLabelChange = useCallback(
    (label: string) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { label })
      }
    },
    [selectedFieldId, updateField]
  )

  const handleDescriptionChange = useCallback(
    (description: string) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { description: description || null })
      }
    },
    [selectedFieldId, updateField]
  )

  const handlePlaceholderChange = useCallback(
    (placeholder: string) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { placeholder: placeholder || null })
      }
    },
    [selectedFieldId, updateField]
  )

  const handleRequiredChange = useCallback(
    (required: boolean) => {
      if (selectedFieldId) {
        updateField(selectedFieldId, { required })
      }
    },
    [selectedFieldId, updateField]
  )

  const handleAddOption = useCallback(() => {
    if (!selectedFieldId || !selectedField) return

    const currentOptions = selectedField.options || []
    const newOption: SelectOption = {
      value: `option${currentOptions.length + 1}`,
      label: `Option ${currentOptions.length + 1}`,
    }
    updateField(selectedFieldId, { options: [...currentOptions, newOption] })
  }, [selectedFieldId, selectedField, updateField])

  const handleUpdateOption = useCallback(
    (index: number, label: string) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = [...selectedField.options]
      newOptions[index] = {
        ...newOptions[index],
        label,
        value: label.toLowerCase().replace(/\s+/g, '_'),
      }
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleDeleteOption = useCallback(
    (index: number) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = selectedField.options.filter((_, i) => i !== index)
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleUpdateOptionColor = useCallback(
    (index: number, color: string | null) => {
      if (!selectedFieldId || !selectedField?.options) return

      const newOptions = [...selectedField.options]
      newOptions[index] = {
        ...newOptions[index],
        color,
      }
      updateField(selectedFieldId, { options: newOptions })
    },
    [selectedFieldId, selectedField, updateField]
  )

  const handleNumberSettingChange = useCallback(
    (key: 'format' | 'min' | 'max' | 'decimals', value: string | number | null) => {
      if (!selectedFieldId || !selectedField) return

      const currentSettings = selectedField.settings || {}
      const currentNumberSettings = currentSettings.number || { format: 'number', decimals: 0 }

      updateField(selectedFieldId, {
        settings: {
          ...currentSettings,
          number: {
            ...currentNumberSettings,
            [key]: value,
          },
        },
      })
    },
    [selectedFieldId, selectedField, updateField]
  )

  if (!selectedField) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Select a field to edit its properties</p>
      </div>
    )
  }

  const showOptions = selectedField.type === 'single_select' || selectedField.type === 'multi_select'
  const showPlaceholder = ['text', 'textarea', 'number', 'email'].includes(selectedField.type)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="font-semibold">Field Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectField(null)}
          className="text-xs"
        >
          Done
        </Button>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="label">Question</Label>
        <Input
          id="label"
          value={selectedField.label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Enter your question"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={selectedField.description || ''}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Add help text for this question"
          rows={2}
        />
      </div>

      {/* Placeholder */}
      {showPlaceholder && (
        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder (optional)</Label>
          <Input
            id="placeholder"
            value={selectedField.placeholder || ''}
            onChange={(e) => handlePlaceholderChange(e.target.value)}
            placeholder="Placeholder text"
          />
        </div>
      )}

      {/* Number settings */}
      {selectedField.type === 'number' && (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <Label className="text-sm font-medium">Number Settings</Label>

          {/* Format */}
          <div className="space-y-1.5">
            <Label htmlFor="number-format" className="text-xs text-muted-foreground">Format</Label>
            <Select
              value={selectedField.settings?.number?.format || 'number'}
              onValueChange={(value) => handleNumberSettingChange('format', value)}
            >
              <SelectTrigger id="number-format" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} align="start" className="!border !border-black dark:!border-white">
                {NUMBER_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min/Max */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="number-min" className="text-xs text-muted-foreground">Min</Label>
              <Input
                id="number-min"
                type="number"
                value={selectedField.settings?.number?.min ?? ''}
                onChange={(e) => handleNumberSettingChange('min', e.target.value ? Number(e.target.value) : null)}
                placeholder="No min"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="number-max" className="text-xs text-muted-foreground">Max</Label>
              <Input
                id="number-max"
                type="number"
                value={selectedField.settings?.number?.max ?? ''}
                onChange={(e) => handleNumberSettingChange('max', e.target.value ? Number(e.target.value) : null)}
                placeholder="No max"
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Decimals */}
          <div className="space-y-1.5">
            <Label htmlFor="number-decimals" className="text-xs text-muted-foreground">Decimal Places</Label>
            <Input
              id="number-decimals"
              type="number"
              min={0}
              max={10}
              value={selectedField.settings?.number?.decimals ?? 0}
              onChange={(e) => handleNumberSettingChange('decimals', Number(e.target.value) || 0)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      )}

      {/* Options for select fields */}
      {showOptions && (
        <div className="space-y-3">
          <Label>Options</Label>
          <div className="space-y-2">
            {selectedField.options?.map((option, index) => {
              const selectedColor = optionColors.find(c => c.name === option.color)
              return (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <Popover open={openColorPickerIndex === index} onOpenChange={(open) => setOpenColorPickerIndex(open ? index : null)}>
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
                    <PopoverContent className="w-auto !p-2 !gap-0 !bg-white dark:!bg-zinc-900 border border-border shadow-md" align="start">
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateOptionColor(index, null)
                            setOpenColorPickerIndex(null)
                          }}
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${!option.color ? 'border-black dark:border-white' : 'border-transparent'}`}
                        >
                          <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        </button>
                        {optionColors.slice(1).map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => {
                              handleUpdateOptionColor(index, color.name)
                              setOpenColorPickerIndex(null)
                            }}
                            className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${option.color === color.name ? 'border-black dark:border-white' : 'border-transparent'}`}
                          >
                            <div className={`h-4 w-4 rounded-full ${color.bg}`} />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={option.label}
                    onChange={(e) => handleUpdateOption(index, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-600"
                    onClick={() => handleDeleteOption(index)}
                    disabled={selectedField.options?.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOption}
            className="w-full !border !border-black dark:!border-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>
      )}

      {/* Required toggle */}
      <div className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-muted/30">
        <div className="space-y-0.5 min-w-0 flex-1">
          <Label htmlFor="required">Required</Label>
          <p className="text-xs text-muted-foreground">
            Make this field mandatory
          </p>
        </div>
        <Switch
          id="required"
          checked={selectedField.required ?? false}
          onCheckedChange={handleRequiredChange}
        />
      </div>

      {/* Conditional Logic */}
      <div className="space-y-2 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Conditional Logic</h4>
          {canAddCondition && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCondition}
              className="h-7 text-xs !border-black dark:!border-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
        <ConditionsPanel />
      </div>
    </div>
  )
})
