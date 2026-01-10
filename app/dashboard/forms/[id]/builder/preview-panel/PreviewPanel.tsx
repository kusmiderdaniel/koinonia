'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Eye, RotateCcw, X } from 'lucide-react'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import { usePreviewState } from './usePreviewState'
import { usePreviewConditions } from './usePreviewConditions'
import { PreviewFieldRenderer } from './PreviewFieldRenderer'
import type { PreviewPanelProps } from './types'

export function PreviewPanel({ onClose, weekStartsOn: weekStartsOnProp }: PreviewPanelProps) {
  const t = useTranslations('forms')
  const { form, fields, conditions, weekStartsOn: weekStartsOnStore } = useFormBuilder()
  const weekStartsOn = weekStartsOnProp ?? weekStartsOnStore

  const {
    values,
    errors,
    handleValueChange,
    handleMultiSelectChange,
    handleReset,
  } = usePreviewState({ fields })

  const { visibleFields, hiddenFieldCount } = usePreviewConditions({
    fields,
    conditions,
    values,
  })

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 h-[72px] border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button size="sm" className="pointer-events-none !border !border-black dark:!border-white bg-white dark:bg-zinc-900">
            <Eye className="h-4 w-4 mr-1" />
            {t('previewPanel.preview')}
          </Button>
          <Button size="sm" onClick={handleReset} className="!border !border-black dark:!border-white bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            {t('previewPanel.reset')}
          </Button>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
        <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-lg border shadow-sm overflow-hidden">
          {/* Form Header */}
          <div className="p-4 border-b bg-muted/30">
            <h2 className="font-semibold text-lg">{form.title}</h2>
            {form.description && (
              <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="p-4 space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('previewPanel.addFields')}
              </p>
            ) : visibleFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('previewPanel.allHidden')}
              </p>
            ) : (
              visibleFields.map((field) => (
                <PreviewFieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  error={errors[field.id]}
                  weekStartsOn={weekStartsOn}
                  onValueChange={handleValueChange}
                  onMultiSelectChange={handleMultiSelectChange}
                />
              ))
            )}

            {fields.length > 0 && (
              <div className="pt-4">
                <button
                  type="button"
                  disabled
                  className="px-8 h-9 rounded-full text-white text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#f49f1e' }}
                >
                  {t('previewPanel.submit')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hidden fields indicator */}
        {fields.length > 0 && hiddenFieldCount > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            {t('previewPanel.hiddenByConditions', { count: hiddenFieldCount })}
          </p>
        )}
      </div>
    </div>
  )
}
