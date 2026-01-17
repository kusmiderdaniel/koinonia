'use client'

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { useFieldEditorHandlers } from './useFieldEditorHandlers'
import { useFormBuilder } from '../../../hooks/useFormBuilder'
import type { Locale } from '@/lib/i18n/config'
import type { BuilderField } from '../../../types'

interface FieldEditorContextValue {
  // Selected field
  selectedField: BuilderField | null
  selectedFieldId: string | null

  // Multilingual state
  isMultilingual: boolean
  activeLocale: Locale
  setActiveLocale: (locale: Locale) => void

  // Computed helpers
  showPlaceholder: boolean
  showOptions: boolean

  // Basic field handlers
  handleLabelChange: (value: string) => void
  handleDescriptionChange: (value: string) => void
  handlePlaceholderChange: (value: string) => void
  handleRequiredChange: (value: boolean) => void

  // Option handlers
  handleAddOption: () => void
  handleUpdateOption: (index: number, label: string) => void
  handleDeleteOption: (index: number) => void
  handleUpdateOptionColor: (index: number, color: string | null) => void

  // Number settings handler
  handleNumberSettingChange: (
    key: 'format' | 'min' | 'max' | 'decimals',
    value: string | number | null
  ) => void

  // Divider settings handler
  handleDividerSettingChange: (key: 'showTitle', value: boolean) => void

  // Close handler
  handleClose: () => void

  // I18n handlers
  handleLabelI18nChange: (locale: Locale, value: string) => void
  handleDescriptionI18nChange: (locale: Locale, value: string) => void
  handlePlaceholderI18nChange: (locale: Locale, value: string) => void
  handleUpdateOptionI18n: (index: number, locale: Locale, label: string) => void
}

const FieldEditorContext = createContext<FieldEditorContextValue | null>(null)

interface FieldEditorProviderProps {
  children: ReactNode
}

export function FieldEditorProvider({ children }: FieldEditorProviderProps) {
  const handlers = useFieldEditorHandlers()
  const { form } = useFormBuilder()
  const [activeLocale, setActiveLocale] = useState<Locale>('en')

  const isMultilingual = form?.is_multilingual ?? false

  // Computed values based on selected field
  const showOptions = handlers.selectedField
    ? handlers.selectedField.type === 'single_select' ||
      handlers.selectedField.type === 'multi_select'
    : false

  const showPlaceholder = handlers.selectedField
    ? ['text', 'textarea', 'number', 'email'].includes(handlers.selectedField.type)
    : false

  const value = useMemo<FieldEditorContextValue>(
    () => ({
      // Selected field
      selectedField: handlers.selectedField ?? null,
      selectedFieldId: handlers.selectedFieldId,

      // Multilingual state
      isMultilingual,
      activeLocale,
      setActiveLocale,

      // Computed helpers
      showPlaceholder,
      showOptions,

      // Handlers
      handleLabelChange: handlers.handleLabelChange,
      handleDescriptionChange: handlers.handleDescriptionChange,
      handlePlaceholderChange: handlers.handlePlaceholderChange,
      handleRequiredChange: handlers.handleRequiredChange,
      handleAddOption: handlers.handleAddOption,
      handleUpdateOption: handlers.handleUpdateOption,
      handleDeleteOption: handlers.handleDeleteOption,
      handleUpdateOptionColor: handlers.handleUpdateOptionColor,
      handleNumberSettingChange: handlers.handleNumberSettingChange,
      handleDividerSettingChange: handlers.handleDividerSettingChange,
      handleClose: handlers.handleClose,
      handleLabelI18nChange: handlers.handleLabelI18nChange,
      handleDescriptionI18nChange: handlers.handleDescriptionI18nChange,
      handlePlaceholderI18nChange: handlers.handlePlaceholderI18nChange,
      handleUpdateOptionI18n: handlers.handleUpdateOptionI18n,
    }),
    [
      handlers.selectedField,
      handlers.selectedFieldId,
      isMultilingual,
      activeLocale,
      showPlaceholder,
      showOptions,
      handlers.handleLabelChange,
      handlers.handleDescriptionChange,
      handlers.handlePlaceholderChange,
      handlers.handleRequiredChange,
      handlers.handleAddOption,
      handlers.handleUpdateOption,
      handlers.handleDeleteOption,
      handlers.handleUpdateOptionColor,
      handlers.handleNumberSettingChange,
      handlers.handleDividerSettingChange,
      handlers.handleClose,
      handlers.handleLabelI18nChange,
      handlers.handleDescriptionI18nChange,
      handlers.handlePlaceholderI18nChange,
      handlers.handleUpdateOptionI18n,
    ]
  )

  return (
    <FieldEditorContext.Provider value={value}>
      {children}
    </FieldEditorContext.Provider>
  )
}

export function useFieldEditorContext() {
  const context = useContext(FieldEditorContext)
  if (!context) {
    throw new Error('useFieldEditorContext must be used within a FieldEditorProvider')
  }
  return context
}

// Re-export for convenience
export type { FieldEditorContextValue }
