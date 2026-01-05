'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Search, FileText } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import { createForm, deleteForm, duplicateForm } from './actions'
import { FormsListView } from './components/FormsListView'
import type { FormWithRelations } from './types'
import type { FormAccessType } from '@/lib/validations/forms'

export interface FormsInitialData {
  forms: FormWithRelations[]
  role: string
}

interface FormsPageClientProps {
  initialData: FormsInitialData
}

export function FormsPageClient({ initialData }: FormsPageClientProps) {
  const router = useRouter()
  const [forms, setForms] = useState(initialData.forms)
  const [searchQuery, setSearchQuery] = useState('')
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
      title: 'Church Members Only',
      description: 'Only signed-in members can respond',
    },
    {
      value: 'public' as FormAccessType,
      title: 'Anyone (Public)',
      description: 'Anyone with the link can respond',
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
      toast.error('Please enter a form title')
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

    toast.success('Form created')
    setIsCreateDialogOpen(false)
    setNewFormTitle('')
    setNewFormDescription('')
    setNewFormAccessType('internal')
    setIsCreating(false)

    // Navigate to the form builder
    if (result.data) {
      router.push(`/dashboard/forms/${result.data.id}`)
    }
  }, [newFormTitle, newFormDescription, newFormAccessType, router])

  const handleDeleteForm = useCallback(async () => {
    if (!deleteDialog.form) return

    setIsDeleting(true)
    const result = await deleteForm(deleteDialog.form.id)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }

    toast.success('Form deleted')
    setForms((prev) => prev.filter((f) => f.id !== deleteDialog.form!.id))
    setDeleteDialog({ open: false, form: null })
    setIsDeleting(false)
  }, [deleteDialog.form])

  const handleDuplicateForm = useCallback(
    async (form: FormWithRelations) => {
      const result = await duplicateForm(form.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Form duplicated')
      if (result.data) {
        router.push(`/dashboard/forms/${result.data.id}`)
      }
    },
    [router]
  )

  const handleFormClick = useCallback(
    (form: FormWithRelations) => {
      router.push(`/dashboard/forms/${form.id}`)
    },
    [router]
  )

  const handleResponsesClick = useCallback(
    (form: FormWithRelations, e: React.MouseEvent) => {
      e.stopPropagation()
      router.push(`/dashboard/forms/${form.id}?tab=responses`)
    },
    [router]
  )

  const openDeleteDialog = useCallback((form: FormWithRelations, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialog({ open: true, form })
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[72px] border-b">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Forms</h1>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-full bg-brand hover:bg-brand/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {forms.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No forms yet"
            description="Create your first form to start collecting responses from your church community."
            action={{
              label: 'Create Form',
              onClick: () => setIsCreateDialogOpen(true),
            }}
          />
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No forms match your search.
          </div>
        ) : (
          <FormsListView
            forms={filteredForms}
            onFormClick={handleFormClick}
            onDeleteClick={openDeleteDialog}
            onDuplicateClick={handleDuplicateForm}
            onResponsesClick={handleResponsesClick}
          />
        )}
      </div>

      {/* Create Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                placeholder="e.g., Event Registration, Volunteer Signup"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder="What is this form for?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Who can respond?</Label>
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
            <button
              type="button"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateForm}
              disabled={isCreating || !newFormTitle.trim()}
              className="px-4 py-2 rounded-full text-white disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#f49f1e' }}
            >
              {isCreating ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, form: deleteDialog.form })}
        title="Delete Form"
        description={
          <span>
            Are you sure you want to delete <strong>{deleteDialog.form?.title}</strong>? This will
            also delete all {deleteDialog.form?.submissions_count || 0} responses. This action
            cannot be undone.
          </span>
        }
        confirmLabel="Delete"
        destructive
        isLoading={isDeleting}
        onConfirm={handleDeleteForm}
      />
    </div>
  )
}
