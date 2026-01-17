'use client'

import { useTranslations } from 'next-intl'
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
  timeFormat?: '12h' | '24h'
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
  timeFormat,
}: TemplatesDialogsProps) {
  const t = useTranslations('events.templatesTab')
  const tCommon = useTranslations('common')

  return (
    <>
      {/* Template Dialog */}
      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={onTemplateDialogOpenChange}
        template={editingTemplate}
        onSuccess={onDialogSuccess}
        timeFormat={timeFormat}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <AlertDialogContent className="!border !border-black dark:!border-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialogConfirmation', { name: templateToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="!border-0 hover:bg-muted">
              {tCommon('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="bg-red-600 hover:bg-red-700 !text-black"
            >
              {tCommon('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
