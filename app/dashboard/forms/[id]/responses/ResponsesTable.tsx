'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, MoreHorizontal, Trash2, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { getFormSubmissions, deleteSubmission } from '../../actions'
import type { FormField, FormSubmission } from '../../types'

interface ResponsesTableProps {
  formId: string
  fields: FormField[]
}

export const ResponsesTable = memo(function ResponsesTable({
  formId,
  fields,
}: ResponsesTableProps) {
  const t = useTranslations('forms')
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

  const loadSubmissions = useCallback(
    async (cursor?: string) => {
      const result = await getFormSubmissions(formId, { cursor })

      if (result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      if (result.data) {
        if (cursor) {
          setSubmissions((prev) => [...prev, ...result.data.submissions])
        } else {
          setSubmissions(result.data.submissions)
        }
        setHasMore(result.data.hasMore)
        setNextCursor(result.data.nextCursor)
      }
      setIsLoading(false)
    },
    [formId]
  )

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const handleLoadMore = useCallback(() => {
    if (nextCursor) {
      loadSubmissions(nextCursor)
    }
  }, [nextCursor, loadSubmissions])

  const handleDelete = useCallback(async () => {
    if (!deleteDialog.id) return

    setIsDeleting(true)
    const result = await deleteSubmission(deleteDialog.id)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }

    toast.success(t('toast.responseDeleted'))
    setSubmissions((prev) => prev.filter((s) => s.id !== deleteDialog.id))
    setDeleteDialog({ open: false, id: null })
    setIsDeleting(false)
  }, [deleteDialog.id])

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/export?format=csv`)
      if (!response.ok) {
        throw new Error('Export failed')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `form-responses-${formId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(t('toast.exportDownloaded'))
    } catch {
      toast.error(t('toast.exportFailed'))
    }
  }, [formId])

  const formatFieldValue = (field: FormField, value: unknown): string => {
    if (value === null || value === undefined || value === '') return t('responses.emptyValue')

    switch (field.type) {
      case 'checkbox':
        return value ? t('responses.yes') : t('responses.no')
      case 'multi_select':
        if (Array.isArray(value)) {
          return value.join(', ')
        }
        return String(value)
      case 'date':
        try {
          return format(new Date(value as string), 'dd/MM/yyyy')
        } catch {
          return String(value)
        }
      case 'number': {
        const numValue = Number(value)
        if (isNaN(numValue)) return String(value)

        const numberSettings = field.settings?.number
        const decimals = numberSettings?.decimals ?? 0
        const format = numberSettings?.format || 'number'

        const formattedNumber = numValue.toFixed(decimals)

        switch (format) {
          case 'currency':
            return `$${formattedNumber}`
          case 'percentage':
            return `${formattedNumber}%`
          default:
            return formattedNumber
        }
      }
      default:
        return String(value)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title={t('responses.empty.title')}
          description={t('responses.empty.description')}
        />
      </div>
    )
  }

  // Show all fields in table
  const displayFields = fields

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('list.responseCount', { count: submissions.length })}
        </p>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 !border !border-black dark:!border-white">
          <Download className="h-4 w-4" />
          {t('responses.exportCsv')}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">{t('responses.submitted')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('responses.respondent')}</TableHead>
                {displayFields.map((field) => (
                  <TableHead key={field.id} className="whitespace-nowrap">
                    {field.label}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {submission.submitted_at
                      ? format(new Date(submission.submitted_at), 'dd/MM/yyyy HH:mm')
                      : '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {submission.respondent ? (
                      <span className="text-sm">
                        {submission.respondent.first_name} {submission.respondent.last_name}
                      </span>
                    ) : submission.respondent_email ? (
                      <span className="text-sm text-muted-foreground">
                        {submission.respondent_email}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">{t('responses.anonymous')}</span>
                    )}
                  </TableCell>
                  {displayFields.map((field) => (
                    <TableCell key={field.id} className="text-sm whitespace-nowrap">
                      {formatFieldValue(field, submission.responses[field.id])}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteDialog({ open: true, id: submission.id })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('list.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} className="gap-2">
            <ChevronDown className="h-4 w-4" />
            {t('responses.loadMore')}
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, id: deleteDialog.id })}
        title={t('responses.deleteDialog.title')}
        description={t('responses.deleteDialog.description')}
        confirmLabel={t('list.delete')}
        destructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
})
