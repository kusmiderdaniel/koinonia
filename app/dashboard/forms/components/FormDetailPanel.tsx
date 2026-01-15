'use client'

import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Users,
  ExternalLink,
  FileText,
  Type,
  AlignLeft,
  Hash,
  Mail,
  Calendar,
  ChevronDown,
  CheckSquare,
  Square,
  Share2,
  Send,
  Check,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useIsMobile } from '@/lib/hooks'
import { getForm, publishForm } from '../actions/forms'
import type { FormWithRelations, FormField } from '../types'

interface FormDetailPanelProps {
  form: FormWithRelations
  onBack?: () => void
  onDelete?: () => void
  onPublish?: () => void
}

const statusStyles = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  single_select: <ChevronDown className="h-4 w-4" />,
  multi_select: <CheckSquare className="h-4 w-4" />,
  checkbox: <Square className="h-4 w-4" />,
}

export const FormDetailPanel = memo(function FormDetailPanel({
  form,
  onBack,
  onDelete,
  onPublish,
}: FormDetailPanelProps) {
  const router = useRouter()
  const t = useTranslations('forms')
  const isMobile = useIsMobile()
  const [formDetail, setFormDetail] = useState<FormWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Ref for timeout cleanup
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  // Fetch full form details with fields
  useEffect(() => {
    let cancelled = false

    async function fetchFormDetail() {
      setIsLoading(true)
      const result = await getForm(form.id)
      if (!cancelled && result.data) {
        setFormDetail(result.data as FormWithRelations)
      }
      if (!cancelled) {
        setIsLoading(false)
      }
    }

    fetchFormDetail()

    return () => {
      cancelled = true
    }
  }, [form.id])

  const handleEditForm = useCallback(() => {
    router.push(`/dashboard/forms/${form.id}`)
  }, [router, form.id])

  const handleViewResponses = useCallback(() => {
    router.push(`/dashboard/forms/${form.id}?tab=responses`)
  }, [router, form.id])

  const handleShare = useCallback(async () => {
    let url: string
    if (form.access_type === 'public' && form.public_token) {
      url = `${window.location.origin}/forms/${form.public_token}`
    } else {
      url = `${window.location.origin}/dashboard/forms/${form.id}/respond`
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success(t('toast.linkCopied'))
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }, [form, t])

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    const result = await publishForm(form.id)

    if (result.error) {
      toast.error(result.error)
      setIsPublishing(false)
      return
    }

    toast.success(t('toast.published'))
    setIsPublishing(false)
    onPublish?.()
    router.refresh()
  }, [form.id, router, t, onPublish])

  const fields = formDetail?.fields || []

  return (
    <Card className="h-full flex flex-col border border-black dark:border-white overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {isMobile && onBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">{form.title}</h2>
              {form.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {form.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyles[form.status as keyof typeof statusStyles] || statusStyles.draft
                  }`}
                >
                  {t(`status.${form.status}`)}
                </span>
                <Badge variant="outline" className="gap-1 text-xs">
                  {form.access_type === 'public' ? (
                    <>
                      <Globe className="h-3 w-3" />
                      {t('access.public')}
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      {t('access.internal')}
                    </>
                  )}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t('list.responseCount', { count: form.submissions_count || 0 })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Share button when published, Publish button when draft with fields */}
            {form.status === 'published' ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full !border !border-black dark:!border-white"
                onClick={handleShare}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1 text-green-600" />
                ) : (
                  <Share2 className="h-4 w-4 mr-1" />
                )}
                {copied ? t('header.copied') : t('header.share')}
              </Button>
            ) : form.status === 'draft' && !isLoading && fields.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full !border !border-black dark:!border-white"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                <Send className="h-4 w-4 mr-1" />
                {isPublishing ? t('header.saving') : t('header.publish')}
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full !border !border-black dark:!border-white"
              onClick={handleViewResponses}
            >
              <Users className="h-4 w-4 mr-1" />
              {t('detail.responses')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={handleEditForm}
              title={t('detail.edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={onDelete}
              title={t('list.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Form Preview */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t('detail.preview')}
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('detail.noFields')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 rounded-full"
              onClick={handleEditForm}
            >
              {t('detail.addFields')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <FormFieldPreview key={field.id} field={field} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

interface FormFieldPreviewProps {
  field: FormField
}

const FormFieldPreview = memo(function FormFieldPreview({ field }: FormFieldPreviewProps) {
  const icon = fieldTypeIcons[field.type] || <Type className="h-4 w-4" />

  return (
    <div className="border border-zinc-200 dark:border-white rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{field.label}</span>
        {field.required && (
          <span className="text-red-500 text-xs">*</span>
        )}
      </div>
      {field.description && (
        <p className="text-xs text-muted-foreground mb-2">{field.description}</p>
      )}

      {/* Field type specific preview */}
      {field.type === 'text' && (
        <div className="h-9 bg-muted/50 rounded border border-zinc-200 dark:border-white px-3 flex items-center">
          <span className="text-sm text-muted-foreground">
            {field.placeholder || 'Text input'}
          </span>
        </div>
      )}

      {field.type === 'textarea' && (
        <div className="h-20 bg-muted/50 rounded border border-zinc-200 dark:border-white p-3">
          <span className="text-sm text-muted-foreground">
            {field.placeholder || 'Long text input'}
          </span>
        </div>
      )}

      {field.type === 'number' && (
        <div className="h-9 bg-muted/50 rounded border border-zinc-200 dark:border-white px-3 flex items-center">
          <span className="text-sm text-muted-foreground">
            {field.placeholder || '0'}
          </span>
        </div>
      )}

      {field.type === 'email' && (
        <div className="h-9 bg-muted/50 rounded border border-zinc-200 dark:border-white px-3 flex items-center">
          <span className="text-sm text-muted-foreground">
            {field.placeholder || 'email@example.com'}
          </span>
        </div>
      )}

      {field.type === 'date' && (
        <div className="h-9 bg-muted/50 rounded border border-zinc-200 dark:border-white px-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Select date</span>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {field.type === 'single_select' && field.options && (
        <div className="h-9 bg-muted/50 rounded border border-zinc-200 dark:border-white px-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {field.options.length > 0 ? `${field.options.length} options` : 'No options'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {field.type === 'multi_select' && field.options && (
        <div className="flex flex-wrap gap-1">
          {field.options.slice(0, 3).map((opt) => (
            <Badge key={opt.value} variant="outline" className="text-xs">
              {opt.label}
            </Badge>
          ))}
          {field.options.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{field.options.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border border-zinc-300 dark:border-zinc-600" />
          <span className="text-sm text-muted-foreground">Yes / No</span>
        </div>
      )}
    </div>
  )
})
