'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getLegalDocument,
  getCurrentPublishedDocument,
  createDraftDocument,
  updateDraftDocument,
  type DocumentType,
  type Language,
  type AcceptanceType,
} from '../actions'
import { toast } from 'sonner'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  effective_date: z.string().min(1, 'Effective date is required'),
  acceptance_type: z.enum(['active', 'silent']),
})

type FormValues = z.infer<typeof formSchema>

interface DocumentEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string | null
  documentType: DocumentType
  language: Language
  onSuccess: () => void
}

const DOCUMENT_TYPE_TITLES: Record<DocumentType, string> = {
  terms_of_service: 'Terms of Service',
  privacy_policy: 'Privacy Policy',
  dpa: 'Data Processing Agreement',
  church_admin_terms: 'Church Administrator Terms',
}

export function DocumentEditorDialog({
  open,
  onOpenChange,
  documentId,
  documentType,
  language,
  onSuccess,
}: DocumentEditorDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false)
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      summary: '',
      effective_date: new Date().toISOString().split('T')[0],
      acceptance_type: 'active',
    },
  })

  const acceptanceType = watch('acceptance_type')
  const content = watch('content')

  const handleInsertCurrent = useCallback(async () => {
    setIsLoadingCurrent(true)
    const result = await getCurrentPublishedDocument(documentType, language)
    setIsLoadingCurrent(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.data) {
      setValue('content', result.data.content)
      toast.success('Current document content inserted')
    }
  }, [documentType, language, setValue])

  useEffect(() => {
    if (!open) {
      reset({
        title: '',
        content: '',
        summary: '',
        effective_date: new Date().toISOString().split('T')[0],
        acceptance_type: 'active',
      })
      setPreviewTab('edit')
      return
    }

    if (documentId) {
      setIsLoading(true)
      getLegalDocument(documentId).then((result) => {
        if (result.data) {
          reset({
            title: result.data.title,
            content: result.data.content,
            summary: result.data.summary || '',
            effective_date: result.data.effective_date.split('T')[0],
            acceptance_type: result.data.acceptance_type,
          })
        }
        setIsLoading(false)
      })
    } else {
      setValue('title', `${DOCUMENT_TYPE_TITLES[documentType]} (${language.toUpperCase()})`)
    }
  }, [open, documentId, documentType, language, reset, setValue])

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true)

    try {
      if (documentId) {
        const result = await updateDraftDocument(documentId, {
          title: values.title,
          content: values.content,
          summary: values.summary,
          effective_date: values.effective_date,
          acceptance_type: values.acceptance_type,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Document saved')
      } else {
        const result = await createDraftDocument({
          document_type: documentType,
          language,
          title: values.title,
          content: values.content,
          summary: values.summary,
          effective_date: values.effective_date,
          acceptance_type: values.acceptance_type as AcceptanceType,
        })

        if (result.error) {
          toast.error(result.error)
          return
        }

        toast.success('Document created')
      }

      onOpenChange(false)
      onSuccess()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">
              {documentId ? 'Edit Document' : 'New Document'}
            </DialogTitle>
            <Badge variant="secondary">{DOCUMENT_TYPE_TITLES[documentType]}</Badge>
            <Badge variant="outline">{language.toUpperCase()}</Badge>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side - Settings */}
              <div className="w-80 flex-shrink-0 border-r overflow-hidden px-6 py-4 flex flex-col gap-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">Document Title</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter document title"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Effective Date */}
                <div className="space-y-2">
                  <Label htmlFor="effective_date" className="text-sm font-medium">Effective Date</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    {...register('effective_date')}
                  />
                  {errors.effective_date && (
                    <p className="text-sm text-destructive">{errors.effective_date.message}</p>
                  )}
                </div>

                {/* Acceptance Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Acceptance Type</Label>
                  <RadioGroup
                    value={acceptanceType}
                    onValueChange={(value) => setValue('acceptance_type', value as 'active' | 'silent')}
                    className="space-y-2"
                  >
                    <label
                      htmlFor="active"
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        acceptanceType === 'active'
                          ? 'border-brand bg-brand/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value="active" id="active" />
                      <div>
                        <div className="font-medium text-sm">Active</div>
                        <div className="text-xs text-muted-foreground">Users must re-accept</div>
                      </div>
                    </label>
                    <label
                      htmlFor="silent"
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                        acceptanceType === 'silent'
                          ? 'border-brand bg-brand/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem value="silent" id="silent" />
                      <div>
                        <div className="font-medium text-sm">Silent</div>
                        <div className="text-xs text-muted-foreground">Auto-accept on login</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-sm font-medium">
                    Change Summary
                  </Label>
                  <Textarea
                    id="summary"
                    {...register('summary')}
                    placeholder="Brief description of what changed..."
                    className="resize-none h-32"
                  />
                </div>
              </div>

              {/* Right Side - Content Editor */}
              <div className="flex-1 flex flex-col overflow-hidden px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Content</Label>
                    {!documentId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleInsertCurrent}
                        disabled={isLoadingCurrent}
                        className="h-7 text-xs text-muted-foreground"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {isLoadingCurrent ? 'Loading...' : 'Insert current'}
                      </Button>
                    )}
                  </div>
                  <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as 'edit' | 'preview')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="edit" className="text-xs px-3 h-7 data-[state=active]:bg-brand data-[state=active]:text-white">Edit</TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs px-3 h-7 data-[state=active]:bg-brand data-[state=active]:text-white">Preview</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  {previewTab === 'edit' ? (
                    <>
                      <Textarea
                        {...register('content')}
                        className="flex-1 resize-none font-mono text-sm [field-sizing:content]"
                        style={{ minHeight: '100%' }}
                        placeholder="# Document Title&#10;&#10;## Section 1&#10;&#10;Content here... Supports **bold**, *italic*, lists, etc."
                      />
                      {errors.content && (
                        <p className="text-sm text-destructive mt-1">{errors.content.message}</p>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 overflow-y-auto border rounded-md bg-muted/30 p-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-xl font-bold mt-6 mb-4 first:mt-0">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-lg font-semibold mt-6 mb-3 border-b pb-2">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm leading-relaxed mb-3 text-muted-foreground">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-outside ml-6 mb-4 space-y-1">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>
                          ),
                        }}
                      >
                        {content || '*No content yet*'}
                      </ReactMarkdown>
                    </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 px-6 py-3 border-t bg-muted/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="min-w-[120px] !bg-brand hover:!bg-brand/90 text-white">
                {isSaving ? 'Saving...' : documentId ? 'Save Changes' : 'Create Draft'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
