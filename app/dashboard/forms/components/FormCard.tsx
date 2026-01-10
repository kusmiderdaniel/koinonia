'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Pencil, Trash2, Globe, Lock, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { FormWithRelations } from '../types'

interface FormCardProps {
  form: FormWithRelations
  isSelected: boolean
  onClick: () => void
  onEdit?: (form: FormWithRelations) => void
  onDuplicate?: (form: FormWithRelations) => void
  onDelete?: (form: FormWithRelations) => void
}

const statusStyles = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

export const FormCard = memo(function FormCard({
  form,
  isSelected,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
}: FormCardProps) {
  const t = useTranslations('forms')

  return (
    <div
      className={`flex rounded-lg border border-black dark:border-white transition-colors ${
        isSelected
          ? 'bg-gray-100 dark:bg-zinc-800'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex-1 text-left p-3 min-w-0"
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1 rounded bg-muted">
            <FileText className="h-3 w-3 text-muted-foreground" />
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              statusStyles[form.status as keyof typeof statusStyles] || statusStyles.draft
            }`}
          >
            {t(`status.${form.status}`)}
          </span>
          <Badge variant="outline" className="gap-0.5 text-xs px-1.5 py-0">
            {form.access_type === 'public' ? (
              <>
                <Globe className="h-2.5 w-2.5" />
                {t('access.public')}
              </>
            ) : (
              <>
                <Lock className="h-2.5 w-2.5" />
                {t('access.internal')}
              </>
            )}
          </Badge>
        </div>
        <p className={`truncate text-sm ${isSelected ? 'font-medium' : ''}`}>
          {form.title}
        </p>
        {form.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {form.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>
            {t('list.responseCount', { count: form.submissions_count || 0 })}
          </span>
          {form.created_at && (
            <>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(form.created_at), { addSuffix: true })}
              </span>
            </>
          )}
        </div>
      </button>
      <div className="flex flex-col justify-center gap-0.5 pr-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate?.(form)
          }}
          title={t('list.duplicate')}
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(form)
          }}
          title={t('detail.edit')}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(form)
          }}
          title={t('list.delete')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
})
