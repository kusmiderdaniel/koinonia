'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
import { useIsMobile } from '@/lib/hooks'
import { statusVariants } from './types'
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
  const t = useTranslations('forms')
  const isMobile = useIsMobile()

  // Mobile layout - more compact with actions in dropdown
  if (isMobile) {
    return (
      <div className="flex items-center justify-between shrink-0 border-b bg-background px-2 h-12">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
            <Link href="/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {isEditingTitle ? (
            <Input
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onBlur={onTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onTitleSave()
                if (e.key === 'Escape') onCancelEditTitle()
              }}
              className="h-7 flex-1 text-sm"
              autoFocus
            />
          ) : (
            <h1
              className="text-sm font-semibold cursor-pointer hover:text-muted-foreground truncate flex-1"
              onClick={onStartEditTitle}
            >
              {currentForm.title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Save button with unsaved indicator */}
          <Button
            variant="outline"
            size="icon"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="h-8 w-8 relative"
          >
            <Save className="h-4 w-4" />
            {isDirty && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-orange-500 rounded-full" />
            )}
          </Button>

          {/* Publish button or Live badge */}
          {currentForm.status === 'draft' ? (
            <Button
              size="sm"
              onClick={onPublish}
              className="h-8 px-3 text-xs rounded-full !bg-brand hover:!bg-brand/90 !text-white"
            >
              {t('header.publish')}
            </Button>
          ) : currentForm.status === 'published' ? (
            <Badge variant="default" className="!bg-green-600 !text-white rounded-full text-xs">
              {t('header.live')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-full text-xs">
              {t('header.closed')}
            </Badge>
          )}

          {/* More menu with all other actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onPreview} className="gap-2">
                <Eye className="h-4 w-4" />
                {t('header.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyLink} className="gap-2">
                {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                {copiedLink ? t('header.copied') : t('header.copyLink')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" disabled>
                {currentForm.access_type === 'public' ? (
                  <>
                    <Globe className="h-4 w-4" />
                    {t('header.publicForm')}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    {t('header.internalForm')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {currentForm.status === 'published' && (
                <>
                  <DropdownMenuItem onClick={onUnpublish}>
                    {t('header.unpublish')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onClose}>
                    {t('header.closeForm')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {currentForm.status === 'closed' && (
                <>
                  <DropdownMenuItem onClick={onPublish}>{t('header.reopenForm')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onNavigateToForms} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('header.backToForms')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="flex items-center justify-between shrink-0 border-b bg-background px-4 h-[72px]">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="flex items-center gap-2 min-w-0 flex-1">
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
              className="text-lg font-semibold cursor-pointer hover:text-muted-foreground truncate"
              onClick={onStartEditTitle}
            >
              {currentForm.title}
            </h1>
          )}

          <Badge
            variant={
              statusVariants[currentForm.status as keyof typeof statusVariants]
            }
          >
            {t(`status.${currentForm.status}`)}
          </Badge>

          <Badge variant="outline" className="gap-1">
            {currentForm.access_type === 'public' ? (
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

          {isDirty && (
            <span className="text-xs text-muted-foreground">{t('header.unsavedChanges')}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyLink}
          className="gap-2"
        >
          {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          {copiedLink ? t('header.copied') : t('header.share')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          {t('header.preview')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? t('header.saving') : t('header.save')}
        </Button>

        {currentForm.status === 'draft' ? (
          <Button
            size="sm"
            onClick={onPublish}
            className="gap-2 rounded-full !bg-brand hover:!bg-brand/90 !text-white"
          >
            {t('header.publish')}
          </Button>
        ) : currentForm.status === 'published' ? (
          <Badge variant="default" className="!bg-green-600 !text-white rounded-full">
            {t('header.live')}
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
                  {t('header.unpublish')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClose}>
                  {t('header.closeFormDesc')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {currentForm.status === 'closed' && (
              <>
                <DropdownMenuItem onClick={onPublish}>{t('header.reopenForm')}</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onNavigateToForms}>
              <Copy className="h-4 w-4 mr-2" />
              {t('header.backToForms')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
