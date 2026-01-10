'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ListDetailLayout } from '@/components/layouts'
import { toast } from 'sonner'
import { createForm, deleteForm, duplicateForm } from './actions'
import { FormsListView, FormDetailPanel } from './components'
import type { FormWithRelations } from './types'
import type { FormAccessType } from '@/lib/validations/forms'

export interface FormsInitialData {
  forms: FormWithRelations[]
  role: string
}

interface FormsPageClientProps {
  initialData: FormsInitialData
}

type StatusFilter = 'all' | 'draft' | 'published' | 'closed'

export function FormsPageClient({ initialData }: FormsPageClientProps) {
  const router = useRouter()
  const t = useTranslations('forms')
  const [forms, setForms] = useState(initialData.forms)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedForm, setSelectedForm] = useState<FormWithRelations | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; form: FormWithRelations | null }>({
    open: false,
    form: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // Create form state
  const [newFormTitle, setNewFormTitle] = useState('')
  const [newFormDescription, setNewFormDescription] = useState('')
  const [newFormAccessType, setNewFormAccessType] = useState<FormAccessType>('internal')

  const accessTypeOptions = [
    {
      value: 'internal' as FormAccessType,
      title: t('access.membersOnly'),
      description: t('access.membersOnlyDescription'),
    },
    {
      value: 'public' as FormAccessType,
      title: t('access.anyone'),
      description: t('access.anyoneDescription'),
    },
  ]

  // Filter forms based on search query
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return forms
    const query = searchQuery.toLowerCase()
    return forms.filter(
      (form) =>
        form.title.toLowerCase().includes(query) ||
        form.description?.toLowerCase().includes(query)
    )
  }, [forms, searchQuery])

  const handleCreateForm = useCallback(async () => {
    if (!newFormTitle.trim()) {
      toast.error(t('toast.titleRequired'))
      return
    }

    setIsCreating(true)
    const result = await createForm({
      title: newFormTitle.trim(),
      description: newFormDescription.trim() || null,
      accessType: newFormAccessType,
    })

    if (result.error) {
      toast.error(result.error)
      setIsCreating(false)
      return
    }

    toast.success(t('toast.created'))
    setIsCreateDialogOpen(false)
    setNewFormTitle('')
    setNewFormDescription('')
    setNewFormAccessType('internal')
    setIsCreating(false)

    // Navigate to the form builder
    if (result.data) {
      router.push(`/dashboard/forms/${result.data.id}`)
    }
  }, [newFormTitle, newFormDescription, newFormAccessType, router, t])

  const handleDeleteForm = useCallback(async () => {
    if (!deleteDialog.form) return

    setIsDeleting(true)
    const result = await deleteForm(deleteDialog.form.id)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }

    toast.success(t('toast.deleted'))
    // Clear selection if deleted form was selected
    if (selectedForm?.id === deleteDialog.form.id) {
      setSelectedForm(null)
    }
    setForms((prev) => prev.filter((f) => f.id !== deleteDialog.form!.id))
    setDeleteDialog({ open: false, form: null })
    setIsDeleting(false)
  }, [deleteDialog.form, selectedForm, t])

  const handleDuplicateForm = useCallback(
    async (form: FormWithRelations) => {
      const result = await duplicateForm(form.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(t('toast.created'))
      if (result.data) {
        router.push(`/dashboard/forms/${result.data.id}`)
      }
    },
    [router, t]
  )

  const handleEditForm = useCallback(
    (form: FormWithRelations) => {
      router.push(`/dashboard/forms/${form.id}`)
    },
    [router]
  )

  const handleSelectForm = useCallback((form: FormWithRelations) => {
    setSelectedForm(form)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedForm(null)
  }, [])

  const openDeleteDialog = useCallback((form: FormWithRelations) => {
    setDeleteDialog({ open: true, form })
  }, [])

  const openCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(true)
  }, [])

  const handleFormPublished = useCallback(() => {
    // Update the form status in local state
    if (selectedForm) {
      const updatedForm = { ...selectedForm, status: 'published' as const }
      setSelectedForm(updatedForm)
      setForms((prev) =>
        prev.map((f) => (f.id === selectedForm.id ? updatedForm : f))
      )
    }
  }, [selectedForm])

  // Header content
  const headerContent = (
    <div>
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('subtitle')}</p>
    </div>
  )

  // Dialogs
  const dialogsContent = (
    <>
      {/* Create Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle>{t('createDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('createDialog.titleLabel')}</Label>
              <Input
                id="title"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder={t('createDialog.titlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('createDialog.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder={t('createDialog.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('createDialog.accessLabel')}</Label>
              <RadioGroup
                value={newFormAccessType}
                onValueChange={(value) => setNewFormAccessType(value as FormAccessType)}
                className="space-y-2"
              >
                {accessTypeOptions.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`access-${option.value}`}
                    className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      newFormAccessType === option.value
                        ? 'border-brand bg-brand/5'
                        : 'border-input hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`access-${option.value}`}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
              className="h-10 px-4 border-zinc-900 dark:border-zinc-100"
            >
              {t('createDialog.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCreateForm}
              disabled={isCreating || !newFormTitle.trim()}
              className="h-10 px-4 !bg-brand hover:!bg-brand/90 !text-white"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreating ? t('createDialog.creating') : t('createForm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, form: deleteDialog.form })}
        title={t('deleteDialog.title')}
        description={t('deleteDialog.description', {
          title: deleteDialog.form?.title ?? '',
          count: deleteDialog.form?.submissions_count || 0,
        })}
        confirmLabel={t('deleteDialog.confirm')}
        destructive
        isLoading={isDeleting}
        onConfirm={handleDeleteForm}
      />
    </>
  )

  // Empty state when no forms exist
  if (forms.length === 0) {
    return (
      <ListDetailLayout
        header={headerContent}
        listView={
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={FileText}
              title={t('empty.title')}
              description={t('empty.description')}
              action={{
                label: t('createForm'),
                onClick: openCreateDialog,
                variant: 'outline',
              }}
            />
          </div>
        }
        detailView={null}
        hasSelection={false}
        onClearSelection={() => {}}
        emptyIcon={FileText}
        emptyTitle={t('detail.selectForm')}
        emptyDescription={t('detail.selectFormDescription')}
        dialogs={dialogsContent}
      />
    )
  }

  return (
    <ListDetailLayout
      header={headerContent}
      listView={
        <FormsListView
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          forms={filteredForms}
          selectedForm={selectedForm}
          onSelectForm={handleSelectForm}
          onCreateForm={openCreateDialog}
          onEditForm={handleEditForm}
          onDuplicateForm={handleDuplicateForm}
          onDeleteForm={openDeleteDialog}
          className="h-full"
        />
      }
      detailView={
        selectedForm ? (
          <FormDetailPanel
            form={selectedForm}
            onBack={handleClearSelection}
            onDelete={() => openDeleteDialog(selectedForm)}
            onPublish={handleFormPublished}
          />
        ) : null
      }
      hasSelection={!!selectedForm}
      selectionTitle={selectedForm?.title || t('title')}
      onClearSelection={handleClearSelection}
      emptyIcon={FileText}
      emptyTitle={t('detail.selectForm')}
      emptyDescription={t('detail.selectFormDescription')}
      dialogs={dialogsContent}
    />
  )
}
