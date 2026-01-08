'use client'

import { useState, useEffect } from 'react'
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
import {
  VISIBILITY_LABELS,
  type LinkTreeLinkRow,
  type LinkVisibility,
} from '../types'

interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: LinkTreeLinkRow | null
  onSave: (link?: LinkTreeLinkRow) => void
}

export function LinkDialog({ open, onOpenChange, link, onSave }: LinkDialogProps) {
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
      toast.error('Title is required')
      return
    }
    if (!url.trim()) {
      toast.error('URL is required')
      return
    }

    // Validate URL
    try {
      new URL(url)
    } catch {
      toast.error('Please enter a valid URL')
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
        toast.success(link ? 'Link updated' : 'Link created')
        onSave(result.link as LinkTreeLinkRow)
      }
    } catch (error) {
      toast.error('Failed to save link')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? 'Edit Link' : 'Add Link'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="link-title">Title *</Label>
            <Input
              id="link-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Link title"
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="link-url">URL *</Label>
            <Input
              id="link-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="link-description">Description (optional)</Label>
            <Textarea
              id="link-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Who can see this link?</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as LinkVisibility)}>
              <SelectTrigger className="!border !border-black dark:!border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-black dark:border-zinc-700">
                {(Object.entries(VISIBILITY_LABELS) as [LinkVisibility, { label: string; description: string }][]).map(
                  ([value, { label, description }]) => (
                    <SelectItem key={value} value={value}>
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground ml-2 text-sm">- {description}</span>
                    </SelectItem>
                  )
                )}
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
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
          >
            {isSaving ? 'Saving...' : link ? 'Save Changes' : 'Add Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
