'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  ArrowLeft,
  Save,
  MoreHorizontal,
  Globe,
  Lock,
  Eye,
  Copy,
  Link as LinkIcon,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFormBuilder } from '../hooks/useFormBuilder'
import { updateForm, publishForm, unpublishForm, closeForm } from '../actions'
import { bulkSaveFormFields } from '../actions/fields'
import { bulkSaveFormConditions } from '../actions/conditions'
import { FormBuilder } from './builder/FormBuilder'
import { PreviewPanel } from './builder/preview-panel'
import { ResponsesTable } from './responses/ResponsesTable'
import type { Form, FormField, FormCondition, BuilderField, BuilderCondition } from '../types'

interface FormBuilderClientProps {
  initialData: {
    form: Form
    fields: FormField[]
    conditions: FormCondition[]
    submissionsCount: number
    role: string
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  }
}

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  published: { label: 'Published', variant: 'default' as const },
  closed: { label: 'Closed', variant: 'outline' as const },
}

export function FormBuilderClient({ initialData }: FormBuilderClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'responses' ? 'responses' : 'build'
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
      })) as BuilderField[]
    )
    setConditions(
      initialData.conditions.map((c) => ({
        ...c,
        isNew: false,
      })) as BuilderCondition[]
    )
    setWeekStartsOn(initialData.firstDayOfWeek)
  }, [initialData, setForm, setFields, setConditions, setWeekStartsOn])

  const handleSave = useCallback(async () => {
    if (!form) return

    setIsSaving(true)

    try {
      // Save form title/description if changed
      if (form.title !== initialData.form.title || form.description !== initialData.form.description) {
        const formResult = await updateForm(form.id, {
          title: form.title,
          description: form.description,
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

      toast.success('Form saved')
      setIsDirty(false)
      router.refresh()
    } catch {
      toast.error('Failed to save form')
    } finally {
      setIsSaving(false)
    }
  }, [form, fields, conditions, initialData, setIsSaving, setIsDirty, router])

  const handlePublish = useCallback(async () => {
    if (!form) return

    // Save first if dirty
    if (isDirty) {
      await handleSave()
    }

    const result = await publishForm(form.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Form published')
    router.refresh()
  }, [form, isDirty, handleSave, router])

  const handleUnpublish = useCallback(async () => {
    if (!form) return

    const result = await unpublishForm(form.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Form unpublished')
    router.refresh()
  }, [form, router])

  const handleClose = useCallback(async () => {
    if (!form) return

    const result = await closeForm(form.id)
    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Form closed')
    router.refresh()
  }, [form, router])

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
      // Internal form - link to the respond page (requires auth)
      url = `${window.location.origin}/dashboard/forms/${form.id}/respond`
    }

    await navigator.clipboard.writeText(url)
    setCopiedLink(true)

    if (form.status !== 'published') {
      toast.success('Link copied! Note: Form must be published for link to work.')
    } else {
      toast.success('Link copied to clipboard')
    }
    setTimeout(() => setCopiedLink(false), 2000)
  }, [form])

  const currentForm = form || initialData.form

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[72px] shrink-0 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave()
                  if (e.key === 'Escape') {
                    setEditTitle(currentForm.title)
                    setIsEditingTitle(false)
                  }
                }}
                className="h-8 w-64"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-semibold cursor-pointer hover:text-muted-foreground"
                onClick={() => {
                  setEditTitle(currentForm.title)
                  setIsEditingTitle(true)
                }}
              >
                {currentForm.title}
              </h1>
            )}

            <Badge variant={statusConfig[currentForm.status as keyof typeof statusConfig]?.variant}>
              {statusConfig[currentForm.status as keyof typeof statusConfig]?.label}
            </Badge>

            <Badge variant="outline" className="gap-1">
              {currentForm.access_type === 'public' ? (
                <>
                  <Globe className="h-3 w-3" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  Internal
                </>
              )}
            </Badge>

            {isDirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            {copiedLink ? 'Copied!' : 'Share'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          {currentForm.status === 'draft' ? (
            <Button
              size="sm"
              onClick={handlePublish}
              className="gap-2 rounded-full !bg-brand hover:!bg-brand/90 !text-white"
            >
              Publish
            </Button>
          ) : currentForm.status === 'published' ? (
            <Badge variant="default" className="!bg-green-600 !text-white rounded-full">
              Live
            </Badge>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentForm.status === 'published' && (
                <>
                  <DropdownMenuItem onClick={handleUnpublish}>
                    Unpublish (back to draft)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClose}>
                    Close form (stop accepting responses)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {currentForm.status === 'closed' && (
                <>
                  <DropdownMenuItem onClick={handlePublish}>
                    Reopen form
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push(`/dashboard/forms`)}>
                <Copy className="h-4 w-4 mr-2" />
                Back to Forms
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4 shrink-0">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger value="build" className="h-8 px-3 rounded-md data-[state=active]:bg-brand data-[state=active]:text-white">
              Build
            </TabsTrigger>
            <TabsTrigger value="responses" className="h-8 px-3 rounded-md data-[state=active]:bg-brand data-[state=active]:text-white">
              Responses ({initialData.submissionsCount})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="build" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <FormBuilder />
        </TabsContent>

        <TabsContent value="responses" className="flex-1 mt-0 min-h-0 overflow-hidden">
          <ResponsesTable formId={currentForm.id} fields={initialData.fields} />
        </TabsContent>
      </Tabs>

      {/* Preview Sheet */}
      <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 !bg-white dark:!bg-zinc-950" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Form Preview</SheetTitle>
          </SheetHeader>
          <PreviewPanel onClose={() => setIsPreviewOpen(false)} weekStartsOn={initialData.firstDayOfWeek} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
