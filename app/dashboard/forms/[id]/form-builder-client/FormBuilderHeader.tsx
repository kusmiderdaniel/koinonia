'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { statusConfig } from './types'
import type { Form } from './types'

interface FormBuilderHeaderProps {
  currentForm: Form
  isDirty: boolean
  isSaving: boolean
  isEditingTitle: boolean
  editTitle: string
  copiedLink: boolean
  onEditTitleChange: (value: string) => void
  onTitleSave: () => void
  onStartEditTitle: () => void
  onCancelEditTitle: () => void
  onSave: () => void
  onPublish: () => void
  onUnpublish: () => void
  onClose: () => void
  onCopyLink: () => void
  onPreview: () => void
  onNavigateToForms: () => void
}

export function FormBuilderHeader({
  currentForm,
  isDirty,
  isSaving,
  isEditingTitle,
  editTitle,
  copiedLink,
  onEditTitleChange,
  onTitleSave,
  onStartEditTitle,
  onCancelEditTitle,
  onSave,
  onPublish,
  onUnpublish,
  onClose,
  onCopyLink,
  onPreview,
  onNavigateToForms,
}: FormBuilderHeaderProps) {
  return (
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
              onChange={(e) => onEditTitleChange(e.target.value)}
              onBlur={onTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onTitleSave()
                if (e.key === 'Escape') onCancelEditTitle()
              }}
              className="h-8 w-64"
              autoFocus
            />
          ) : (
            <h1
              className="text-lg font-semibold cursor-pointer hover:text-muted-foreground"
              onClick={onStartEditTitle}
            >
              {currentForm.title}
            </h1>
          )}

          <Badge
            variant={
              statusConfig[currentForm.status as keyof typeof statusConfig]?.variant
            }
          >
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

          {isDirty && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCopyLink} className="gap-2">
          {copiedLink ? (
            <Check className="h-4 w-4" />
          ) : (
            <LinkIcon className="h-4 w-4" />
          )}
          {copiedLink ? 'Copied!' : 'Share'}
        </Button>

        <Button variant="outline" size="sm" onClick={onPreview} className="gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {currentForm.status === 'draft' ? (
          <Button
            size="sm"
            onClick={onPublish}
            className="gap-2 rounded-full !bg-brand hover:!bg-brand/90 !text-white"
          >
            Publish
          </Button>
        ) : currentForm.status === 'published' ? (
          <Badge
            variant="default"
            className="!bg-green-600 !text-white rounded-full"
          >
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
                <DropdownMenuItem onClick={onUnpublish}>
                  Unpublish (back to draft)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClose}>
                  Close form (stop accepting responses)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {currentForm.status === 'closed' && (
              <>
                <DropdownMenuItem onClick={onPublish}>Reopen form</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onNavigateToForms}>
              <Copy className="h-4 w-4 mr-2" />
              Back to Forms
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
