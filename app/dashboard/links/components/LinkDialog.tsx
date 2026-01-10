'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createLink, updateLink } from '../actions'
import type { LinkTreeLinkRow, LinkVisibility } from '../types'

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: LinkTreeLinkRow | null
  onSave: (link?: LinkTreeLinkRow) => void
}

const VISIBILITY_OPTIONS: LinkVisibility[] = ['public', 'member', 'volunteer', 'leader', 'admin']

export function LinkDialog({ open, onOpenChange, link, onSave }: LinkDialogProps) {
  const t = useTranslations('links')
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<LinkVisibility>('public')

  // Reset form when dialog opens/closes or link changes
  useEffect(() => {
    if (link) {
      setTitle(link.title)
      setUrl(link.url)
      setDescription(link.description || '')
      setVisibility((link.visibility as LinkVisibility) || 'public')
    } else {
      setTitle('')
      setUrl('')
      setDescription('')
      setVisibility('public')
    }
  }, [link, open])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t('validation.titleRequired'))
      return
    }
    if (!url.trim()) {
      toast.error(t('validation.urlRequired'))
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      toast.error(t('validation.invalidUrl'))
      return
    }

    setIsSaving(true)
    try {
      const data = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || null,
        visibility,
      }

      let result
      if (link) {
        result = await updateLink(link.id, data)
      } else {
        result = await createLink(data)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(link ? t('toast.linkUpdated') : t('toast.linkCreated'))
        onSave(result.link as LinkTreeLinkRow)
      }
    } catch (error) {
      toast.error(t('toast.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? t('linkDialog.editTitle') : t('linkDialog.addTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="link-title">{t('linkDialog.titleLabel')}</Label>
            <Input
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('linkDialog.titlePlaceholder')}
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="link-url">{t('linkDialog.urlLabel')}</Label>
            <Input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('linkDialog.urlPlaceholder')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="link-description">{t('linkDialog.descriptionLabel')}</Label>
            <Textarea
              id="link-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('linkDialog.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>{t('linkDialog.visibilityLabel')}</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as LinkVisibility)}>
              <SelectTrigger className="!border !border-black dark:!border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-black dark:border-zinc-700">
                {VISIBILITY_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    <span className="font-medium">{t(`visibility.${value}.label`)}</span>
                    <span className="text-muted-foreground ml-2 text-sm">- {t(`visibility.${value}.description`)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="!border !border-black dark:!border-white"
          >
            {t('linkDialog.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
          >
            {isSaving ? t('linkDialog.saving') : link ? t('linkDialog.saveChanges') : t('linkDialog.addButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
