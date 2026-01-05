'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus } from 'lucide-react'
import { ConditionsPanel, useConditionActions } from '../ConditionsPanel'
import { useFieldEditorHandlers } from './useFieldEditorHandlers'
import { FieldEditorBasicFields } from './FieldEditorBasicFields'
import { FieldEditorNumberSettings } from './FieldEditorNumberSettings'
import { FieldEditorOptions } from './FieldEditorOptions'

export const FieldEditor = memo(function FieldEditor() {
  const handlers = useFieldEditorHandlers()
  const { handleAddCondition, canAddCondition } = useConditionActions()

  if (!handlers.selectedField) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Select a field to edit its properties</p>
      </div>
    )
  }

  const showOptions =
    handlers.selectedField.type === 'single_select' ||
    handlers.selectedField.type === 'multi_select'
  const showPlaceholder = ['text', 'textarea', 'number', 'email'].includes(
    handlers.selectedField.type
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <h3 className="font-semibold">Field Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlers.handleClose}
          className="text-xs"
        >
          Done
        </Button>
      </div>

      <FieldEditorBasicFields
        label={handlers.selectedField.label}
        description={handlers.selectedField.description}
        placeholder={handlers.selectedField.placeholder}
        showPlaceholder={showPlaceholder}
        onLabelChange={handlers.handleLabelChange}
        onDescriptionChange={handlers.handleDescriptionChange}
        onPlaceholderChange={handlers.handlePlaceholderChange}
      />

      {/* Number settings */}
      {handlers.selectedField.type === 'number' && (
        <FieldEditorNumberSettings
          settings={handlers.selectedField.settings?.number}
          onSettingChange={handlers.handleNumberSettingChange}
        />
      )}

      {/* Options for select fields */}
      {showOptions && (
        <FieldEditorOptions
          options={handlers.selectedField.options ?? undefined}
          onAddOption={handlers.handleAddOption}
          onUpdateOption={handlers.handleUpdateOption}
          onDeleteOption={handlers.handleDeleteOption}
          onUpdateOptionColor={handlers.handleUpdateOptionColor}
        />
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
          checked={handlers.selectedField.required ?? false}
          onCheckedChange={handlers.handleRequiredChange}
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
