import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useFormBuilder } from '../../hooks/useFormBuilder'
import { updateForm, publishForm, unpublishForm, closeForm } from '../../actions'
import { bulkSaveFormFields } from '../../actions/fields'
import { bulkSaveFormConditions } from '../../actions/conditions'
import type { BuilderField, BuilderCondition } from '../../types'
import type { FormBuilderClientProps } from './types'

export function useFormBuilderClientState({ initialData }: FormBuilderClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('forms')
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'responses' ? 'responses' : tabParam === 'settings' ? 'settings' : 'build'

  // Local UI state
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(initialData.form.title)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Get store actions and state
  const {
    form,
    fields,
    conditions,
    isDirty,
    isSaving,
    setForm,
    setFields,
    setConditions,
    updateFormTitle,
    setIsSaving,
    setIsDirty,
    setWeekStartsOn,
  } = useFormBuilder()

  // Initialize store with initial data
  useEffect(() => {
    setForm(initialData.form)
    setFields(
      initialData.fields.map((f) => ({
        ...f,
        isNew: false,
      })) as unknown as BuilderField[]
    )
    setConditions(
      initialData.conditions.map((c) => ({
        ...c,
        isNew: false,
      })) as unknown as BuilderCondition[]
    )
    setWeekStartsOn(initialData.firstDayOfWeek)
  }, [initialData, setForm, setFields, setConditions, setWeekStartsOn])

  const handleSave = useCallback(async () => {
    if (!form) return

    setIsSaving(true)

    try {
      // Save form title/description/access_type if changed
      if (
        form.title !== initialData.form.title ||
        form.description !== initialData.form.description ||
        form.access_type !== initialData.form.access_type
      ) {
        const formResult = await updateForm(form.id, {
          title: form.title,
          description: form.description,
          accessType: form.access_type,
        })
        if (formResult.error) {
          toast.error(formResult.error)
          setIsSaving(false)
          return
        }
      }

      // Save fields
      const fieldsToSave = fields.map((f) => ({
        id: f.isNew ? undefined : f.id,
        type: f.type,
        label: f.label,
        description: f.description || undefined,
        placeholder: f.placeholder || undefined,
        required: f.required ?? false,
        options: f.options || undefined,
        settings: f.settings || undefined,
        sortOrder: f.sort_order,
        isNew: f.isNew,
      }))

      const fieldsResult = await bulkSaveFormFields(form.id, fieldsToSave)
      if (fieldsResult.error) {
        toast.error(fieldsResult.error)
        setIsSaving(false)
        return
      }

      // Save conditions
      const conditionsToSave = conditions.map((c) => ({
        id: c.isNew ? undefined : c.id,
        targetFieldId: c.target_field_id,
        sourceFieldId: c.source_field_id,
        operator: c.operator,
        value: c.value,
        action: c.action,
        isNew: c.isNew,
      }))

      const conditionsResult = await bulkSaveFormConditions(form.id, conditionsToSave)
      if (conditionsResult.error) {
        toast.error(conditionsResult.error)
        setIsSaving(false)
        return
      }

      toast.success(t('toast.saved'))
      setIsDirty(false)
      router.refresh()
    } catch {
      toast.error(t('toast.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }, [form, fields, conditions, initialData, setIsSaving, setIsDirty, router, t])

  const handlePublish = useCallback(async () => {
    if (!form) return

    if (isDirty) {
      await handleSave()
    }

    const result = await publishForm(form.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(t('toast.published'))
    router.refresh()
  }, [form, isDirty, handleSave, router, t])

  const handleUnpublish = useCallback(async () => {
    if (!form) return

    const result = await unpublishForm(form.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(t('toast.unpublished'))
    router.refresh()
  }, [form, router, t])

  const handleClose = useCallback(async () => {
    if (!form) return

    const result = await closeForm(form.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(t('toast.closed'))
    router.refresh()
  }, [form, router, t])

  const handleTitleSave = useCallback(() => {
    if (editTitle.trim()) {
      updateFormTitle(editTitle.trim())
    }
    setIsEditingTitle(false)
  }, [editTitle, updateFormTitle])

  const handleCopyLink = useCallback(async () => {
    if (!form) return

    let url: string
    if (form.access_type === 'public' && form.public_token) {
      url = `${window.location.origin}/forms/${form.public_token}`
    } else {
      url = `${window.location.origin}/dashboard/forms/${form.id}/respond`
    }

    await navigator.clipboard.writeText(url)
    setCopiedLink(true)

    if (form.status !== 'published') {
      toast.success(t('toast.linkCopiedNote'))
    } else {
      toast.success(t('toast.linkCopied'))
    }
    setTimeout(() => setCopiedLink(false), 2000)
  }, [form, t])

  const currentForm = form || initialData.form

  return {
    // UI state
    activeTab,
    setActiveTab,
    isEditingTitle,
    setIsEditingTitle,
    editTitle,
    setEditTitle,
    copiedLink,
    isPreviewOpen,
    setIsPreviewOpen,

    // Form state
    currentForm,
    isDirty,
    isSaving,

    // Actions
    handleSave,
    handlePublish,
    handleUnpublish,
    handleClose,
    handleTitleSave,
    handleCopyLink,

    // Router
    router,
  }
}
