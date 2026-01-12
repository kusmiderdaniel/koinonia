'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { LanguageTabs } from '@/components/forms'
import { useIsMobile } from '@/lib/hooks'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import type { Locale } from '@/lib/i18n/config'

export const FieldEditor = memo(function FieldEditor() {
  const t = useTranslations('forms')
  const handlers = useFieldEditorHandlers()
  const { handleAddCondition, canAddCondition } = useConditionActions()
  const { form } = useFormBuilder()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('settings')
  const [activeLocale, setActiveLocale] = useState<Locale>('en')
  const isMultilingual = form?.is_multilingual ?? false

  if (!handlers.selectedField) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">{t('fieldEditor.selectField')}</p>
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
              {t('fieldEditor.tabs.settings')}
            </TabsTrigger>
            <TabsTrigger
              value="logic"
              className={`${isMobile ? 'text-xs px-3 h-7' : 'text-sm px-4'} data-[state=active]:bg-brand data-[state=active]:text-white`}
            >
              {t('fieldEditor.tabs.logic')}
            </TabsTrigger>
          </TabsList>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlers.handleClose}
              className="text-xs"
            >
              {t('fieldEditor.done')}
            </Button>
          )}
        </div>

        <TabsContent value="settings" className={`mt-0 ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
          {/* Single language picker for the entire field */}
          {isMultilingual && (
            <LanguageTabs
              activeLocale={activeLocale}
              onLocaleChange={setActiveLocale}
              missingLocales={!handlers.selectedField.label_i18n?.pl ? ['pl'] : []}
            />
          )}

          <FieldEditorBasicFields
            label={handlers.selectedField.label}
            description={handlers.selectedField.description}
            placeholder={handlers.selectedField.placeholder}
            showPlaceholder={showPlaceholder}
            onLabelChange={handlers.handleLabelChange}
            onDescriptionChange={handlers.handleDescriptionChange}
            onPlaceholderChange={handlers.handlePlaceholderChange}
            isMultilingual={isMultilingual}
            activeLocale={activeLocale}
            labelI18n={handlers.selectedField.label_i18n}
            descriptionI18n={handlers.selectedField.description_i18n}
            placeholderI18n={handlers.selectedField.placeholder_i18n}
            onLabelI18nChange={handlers.handleLabelI18nChange}
            onDescriptionI18nChange={handlers.handleDescriptionI18nChange}
            onPlaceholderI18nChange={handlers.handlePlaceholderI18nChange}
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
              isMultilingual={isMultilingual}
              activeLocale={activeLocale}
              optionsI18n={handlers.selectedField.options_i18n}
              onUpdateOptionI18n={handlers.handleUpdateOptionI18n}
            />
          )}

          {/* Required toggle */}
          <div className={`flex items-center justify-between gap-4 border rounded-lg bg-muted/30 ${isMobile ? 'p-2' : 'p-3'}`}>
            <div className="space-y-0.5 min-w-0 flex-1">
              <Label htmlFor="required" className={isMobile ? 'text-sm' : ''}>{t('fieldEditor.required')}</Label>
              {!isMobile && (
                <p className="text-xs text-muted-foreground">
                  {t('fieldEditor.requiredHelp')}
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
              {t('fieldEditor.logicInstruction')}
            </p>
            {canAddCondition && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                className={`text-xs !border-black dark:!border-white ${isMobile ? 'h-6 px-2' : 'h-7'}`}
              >
                <Plus className="h-3 w-3 mr-1" />
                {t('fieldEditor.add')}
              </Button>
            )}
          </div>
          <ConditionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
})
