'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Music } from 'lucide-react'

interface SongPlaceholderAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAdding: boolean
  error: string | null
  onAdd: () => void
}

export function SongPlaceholderAddDialog({
  open,
  onOpenChange,
  isAdding,
  error,
  onAdd,
}: SongPlaceholderAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Add Song Placeholder</DialogTitle>
          <DialogDescription>
            This will create a placeholder for a song to be selected later.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <Music className="w-8 h-8 text-purple-500" />
          <div>
            <p className="font-medium text-purple-900 dark:text-purple-100">
              Song Placeholder
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Duration will be set from the song&apos;s default when selected.
            </p>
          </div>
        </div>

        <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline-pill-muted"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={onAdd}
            disabled={isAdding}
            className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
          >
            {isAdding ? 'Adding...' : 'Add Song'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
