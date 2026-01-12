import { create } from 'zustand'
import type { Form, BuilderField, BuilderCondition, FormBuilderState, INITIAL_BUILDER_STATE } from '../types'
import type { FieldType, FormAccessType, TranslatedString } from '@/lib/validations/forms'
import type { Locale } from '@/lib/i18n/config'

interface FormBuilderActions {
  // Form actions
  setForm: (form: Form | null) => void
  updateFormTitle: (title: string) => void
  updateFormDescription: (description: string | null) => void
  updateFormTitleI18n: (locale: Locale, title: string) => void
  updateFormDescriptionI18n: (locale: Locale, description: string) => void
  updateFormAccessType: (accessType: FormAccessType) => void
  updateFormAllowMultipleSubmissions: (allow: boolean) => void
  updateFormIsMultilingual: (isMultilingual: boolean) => void

  // Field actions
  setFields: (fields: BuilderField[]) => void
  addField: (type: FieldType, label?: string, index?: number) => string // returns new field ID
  duplicateField: (id: string) => string | null // returns new field ID or null if not found
  updateField: (id: string, updates: Partial<BuilderField>) => void
  deleteField: (id: string) => void
  reorderFields: (activeId: string, overId: string) => void

  // Selection
  selectField: (id: string | null) => void

  // Conditions
  setConditions: (conditions: BuilderCondition[]) => void
  addCondition: (condition: Omit<BuilderCondition, 'id' | 'isNew'>) => string
  updateCondition: (id: string, updates: Partial<BuilderCondition>) => void
  deleteCondition: (id: string) => void

  // State management
  setIsDirty: (isDirty: boolean) => void
  setIsSaving: (isSaving: boolean) => void
  setError: (error: string | null) => void
  setWeekStartsOn: (weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void
  reset: () => void
}

type FormBuilderStore = FormBuilderState & FormBuilderActions

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// Fallback labels if translations aren't provided (shouldn't happen in normal usage)
const FALLBACK_LABELS: Record<FieldType, string> = {
  text: 'Short Answer',
  textarea: 'Long Answer',
  number: 'Number',
  email: 'Email',
  date: 'Date',
  single_select: 'Dropdown',
  multi_select: 'Multiple Choice',
  checkbox: 'Checkbox',
}

export const useFormBuilder = create<FormBuilderStore>((set, get) => ({
  // Initial state
  form: null,
  fields: [],
  conditions: [],
  selectedFieldId: null,
  isDirty: false,
  isSaving: false,
  error: null,
  weekStartsOn: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,

  // Form actions
  setForm: (form) => set({ form }),

  updateFormTitle: (title) =>
    set((state) => ({
      form: state.form ? { ...state.form, title } : null,
      isDirty: true,
    })),

  updateFormDescription: (description) =>
    set((state) => ({
      form: state.form ? { ...state.form, description } : null,
      isDirty: true,
    })),

  updateFormTitleI18n: (locale, title) =>
    set((state) => {
      if (!state.form) return state
      const currentI18n = state.form.title_i18n || { en: state.form.title }
      const newI18n: TranslatedString = { ...currentI18n, [locale]: title }
      // Also update the base title if editing English
      const newTitle = locale === 'en' ? title : state.form.title
      return {
        form: { ...state.form, title: newTitle, title_i18n: newI18n },
        isDirty: true,
      }
    }),

  updateFormDescriptionI18n: (locale, description) =>
    set((state) => {
      if (!state.form) return state
      const currentI18n = state.form.description_i18n || { en: state.form.description || '' }
      const newI18n: TranslatedString = { ...currentI18n, [locale]: description }
      // Also update the base description if editing English
      const newDescription = locale === 'en' ? (description || null) : state.form.description
      return {
        form: { ...state.form, description: newDescription, description_i18n: newI18n },
        isDirty: true,
      }
    }),

  updateFormAccessType: (access_type) =>
    set((state) => ({
      form: state.form ? { ...state.form, access_type } : null,
      isDirty: true,
    })),

  updateFormAllowMultipleSubmissions: (allow_multiple_submissions) =>
    set((state) => ({
      form: state.form ? { ...state.form, allow_multiple_submissions } : null,
      isDirty: true,
    })),

  updateFormIsMultilingual: (is_multilingual) =>
    set((state) => ({
      form: state.form ? { ...state.form, is_multilingual } : null,
      isDirty: true,
    })),

  // Field actions
  setFields: (fields) => set({ fields }),

  addField: (type, label, index) => {
    const id = generateTempId()
    const { fields } = get()
    const insertIndex = index !== undefined ? index : fields.length

    const newField: BuilderField = {
      id,
      type,
      label: label || FALLBACK_LABELS[type] || 'Question',
      label_i18n: null,
      description: null,
      description_i18n: null,
      placeholder: null,
      placeholder_i18n: null,
      required: false,
      options: type === 'single_select' || type === 'multi_select' ? [{ value: 'option1', label: 'Option 1' }] : null,
      options_i18n: null,
      settings: type === 'number' ? { number: { format: 'number', decimals: 0 } } : null,
      sort_order: insertIndex,
      isNew: true,
    }

    // Recalculate sort orders for all fields
    const newFields = [...fields]
    newFields.splice(insertIndex, 0, newField)
    const reorderedFields = newFields.map((f, i) => ({ ...f, sort_order: i }))

    set({ fields: reorderedFields, selectedFieldId: id, isDirty: true })
    return id
  },

  duplicateField: (id) => {
    const { fields } = get()
    const fieldIndex = fields.findIndex((f) => f.id === id)
    if (fieldIndex === -1) return null

    const fieldToDuplicate = fields[fieldIndex]
    const newId = generateTempId()

    const duplicatedField: BuilderField = {
      ...fieldToDuplicate,
      id: newId,
      label: `${fieldToDuplicate.label} (copy)`,
      options: fieldToDuplicate.options ? [...fieldToDuplicate.options] : null,
      settings: fieldToDuplicate.settings ? { ...fieldToDuplicate.settings } : null,
      sort_order: fieldIndex + 1,
      isNew: true,
    }

    // Insert after the original field
    const newFields = [...fields]
    newFields.splice(fieldIndex + 1, 0, duplicatedField)
    const reorderedFields = newFields.map((f, i) => ({ ...f, sort_order: i }))

    set({ fields: reorderedFields, selectedFieldId: newId, isDirty: true })
    return newId
  },

  updateField: (id, updates) =>
    set((state) => ({
      fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      isDirty: true,
    })),

  deleteField: (id) =>
    set((state) => {
      const newFields = state.fields
        .filter((f) => f.id !== id)
        .map((f, i) => ({ ...f, sort_order: i }))

      // Also delete conditions that reference this field
      const newConditions = state.conditions.filter(
        (c) => c.target_field_id !== id && c.source_field_id !== id
      )

      return {
        fields: newFields,
        conditions: newConditions,
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
        isDirty: true,
      }
    }),

  reorderFields: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.fields.findIndex((f) => f.id === activeId)
      const newIndex = state.fields.findIndex((f) => f.id === overId)

      if (oldIndex === -1 || newIndex === -1) return state

      const newFields = [...state.fields]
      const [removed] = newFields.splice(oldIndex, 1)
      newFields.splice(newIndex, 0, removed)

      // Recalculate sort orders
      const reorderedFields = newFields.map((f, i) => ({ ...f, sort_order: i }))

      return { fields: reorderedFields, isDirty: true }
    }),

  // Selection
  selectField: (id) => set({ selectedFieldId: id }),

  // Conditions
  setConditions: (conditions) => set({ conditions }),

  addCondition: (condition) => {
    const id = generateTempId()
    const newCondition: BuilderCondition = {
      ...condition,
      id,
      isNew: true,
    }
    set((state) => ({
      conditions: [...state.conditions, newCondition],
      isDirty: true,
    }))
    return id
  },

  updateCondition: (id, updates) =>
    set((state) => ({
      conditions: state.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      isDirty: true,
    })),

  deleteCondition: (id) =>
    set((state) => ({
      conditions: state.conditions.filter((c) => c.id !== id),
      isDirty: true,
    })),

  // State management
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
  setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),

  reset: () =>
    set({
      form: null,
      fields: [],
      conditions: [],
      selectedFieldId: null,
      isDirty: false,
      isSaving: false,
      error: null,
      weekStartsOn: 0,
    }),
}))
