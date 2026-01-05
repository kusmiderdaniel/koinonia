'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TemplateDialog } from '../template-dialog'
import type { Template, TemplateDetail } from './types'

interface TemplatesDialogsProps {
  templateDialogOpen: boolean
  onTemplateDialogOpenChange: (open: boolean) => void
  editingTemplate: TemplateDetail | null
  onDialogSuccess: () => void
  deleteDialogOpen: boolean
  onDeleteDialogOpenChange: (open: boolean) => void
  templateToDelete: Template | null
  onConfirmDelete: () => void
}

export function TemplatesDialogs({
  templateDialogOpen,
  onTemplateDialogOpenChange,
  editingTemplate,
  onDialogSuccess,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  templateToDelete,
  onConfirmDelete,
}: TemplatesDialogsProps) {
  return (
    <>
      {/* Template Dialog */}
      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={onTemplateDialogOpenChange}
        template={editingTemplate}
        onSuccess={onDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
