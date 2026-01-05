'use client'

import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Copy,
  Trash2,
  Globe,
  Lock,
  FileText,
  Users,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { FormWithRelations } from '../types'

interface FormsListViewProps {
  forms: FormWithRelations[]
  onFormClick: (form: FormWithRelations) => void
  onDeleteClick: (form: FormWithRelations, e: React.MouseEvent) => void
  onDuplicateClick: (form: FormWithRelations) => void
  onResponsesClick: (form: FormWithRelations, e: React.MouseEvent) => void
}

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  published: { label: 'Published', variant: 'default' as const },
  closed: { label: 'Closed', variant: 'outline' as const },
}

export const FormsListView = memo(function FormsListView({
  forms,
  onFormClick,
  onDeleteClick,
  onDuplicateClick,
  onResponsesClick,
}: FormsListViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <Card
          key={form.id}
          className="cursor-pointer hover:shadow-md transition-shadow border border-black dark:border-white"
          onClick={() => onFormClick(form)}
        >
          <CardContent className="p-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="p-1.5 rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate text-sm">{form.title}</h3>
                  {form.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {form.description}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicateClick(form)
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => onDeleteClick(form, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant={statusConfig[form.status as keyof typeof statusConfig]?.variant || 'secondary'} className="text-xs px-1.5 py-0">
                {statusConfig[form.status as keyof typeof statusConfig]?.label || form.status}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs px-1.5 py-0">
                {form.access_type === 'public' ? (
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
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={(e) => onResponsesClick(form, e)}
              >
                <Users className="h-3 w-3" />
                <span>
                  {form.submissions_count || 0}{' '}
                  {form.submissions_count === 1 ? 'response' : 'responses'}
                </span>
              </button>
              {form.created_at && (
                <span>
                  {formatDistanceToNow(new Date(form.created_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})
