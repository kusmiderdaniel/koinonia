'use client'

import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { ConditionsPanel, useConditionActions } from '../ConditionsPanel'
import { useFieldEditorHandlers } from './useFieldEditorHandlers'
import { FieldEditorBasicFields } from './FieldEditorBasicFields'
import { FieldEditorNumberSettings } from './FieldEditorNumberSettings'
import { FieldEditorOptions } from './FieldEditorOptions'
import { useIsMobile } from '@/lib/hooks'

export const FieldEditor = memo(function FieldEditor() {
  const handlers = useFieldEditorHandlers()
  const { handleAddCondition, canAddCondition } = useConditionActions()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('settings')

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
    <div className={isMobile ? 'p-3' : 'p-4'}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
          <TabsList className={`bg-muted/50 border border-black dark:border-white ${isMobile ? 'h-8' : 'h-9'}`}>
            <TabsTrigger
              value="settings"
              className={`${isMobile ? 'text-xs px-3 h-7' : 'text-sm px-4'} data-[state=active]:bg-brand data-[state=active]:text-white`}
            >
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="logic"
              className={`${isMobile ? 'text-xs px-3 h-7' : 'text-sm px-4'} data-[state=active]:bg-brand data-[state=active]:text-white`}
            >
              Logic
            </TabsTrigger>
          </TabsList>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlers.handleClose}
              className="text-xs"
            >
              Done
            </Button>
          )}
        </div>

        <TabsContent value="settings" className={`mt-0 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
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
          <div className={`flex items-center justify-between gap-4 border rounded-lg bg-muted/30 ${isMobile ? 'p-2' : 'p-3'}`}>
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="required" className={isMobile ? 'text-sm' : ''}>Required</Label>
              {!isMobile && (
                <p className="text-xs text-muted-foreground">
                  Make this field mandatory
                </p>
              )}
            </div>
            <Switch
              id="required"
              checked={handlers.selectedField.required ?? false}
              onCheckedChange={handlers.handleRequiredChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="logic" className={`mt-0 ${isMobile ? 'space-y-2' : 'space-y-3'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              Show/hide this field based on answers
            </p>
            {canAddCondition && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                className={`text-xs !border-black dark:!border-white ${isMobile ? 'h-6 px-2' : 'h-7'}`}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>
          <ConditionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
})
