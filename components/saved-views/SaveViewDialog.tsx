'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createSavedView, updateSavedView } from '@/lib/actions/saved-views'
import type { SaveViewDialogProps } from '@/types/saved-views'

export function SaveViewDialog({
  open,
  onOpenChange,
  viewType,
  currentFilterState,
  currentSortState,
  currentGroupBy = 'none',
  editingView,
  onSuccess,
}: SaveViewDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!editingView

  // Reset form when dialog opens/closes or editing view changes
  useEffect(() => {
    if (open) {
      if (editingView) {
        setName(editingView.name)
        setDescription(editingView.description || '')
        setIsDefault(editingView.is_default)
      } else {
        setName('')
        setDescription('')
        setIsDefault(false)
      }
    }
  }, [open, editingView])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('View name is required')
      return
    }

    setIsLoading(true)

    const viewData = {
      name: name.trim(),
      description: description.trim() || null,
      view_type: viewType,
      filter_state: currentFilterState,
      sort_state: currentSortState,
      group_by: viewType === 'tasks' ? currentGroupBy : null,
      is_default: isDefault,
    }

    const result = isEditing
      ? await updateSavedView(editingView.id, viewData)
      : await createSavedView(viewData)

    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(isEditing ? 'View updated' : 'View saved')
      onOpenChange(false)
      if (result.data && onSuccess) {
        onSuccess(result.data)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit View' : 'Save View'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the view name and settings.'
                : 'Save your current filters and sort settings as a reusable view.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Assigned Tasks"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is-default" className="font-medium">
                  Set as default
                </Label>
                <p className="text-sm text-muted-foreground">
                  This view will load automatically for all members.
                </p>
              </div>
              <Switch id="is-default" checked={isDefault} onCheckedChange={setIsDefault} />
            </div>
          </div>

          <DialogFooter className="!bg-transparent !border-0">
            <Button
              type="button"
              variant="outline-pill-muted"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Save View'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
