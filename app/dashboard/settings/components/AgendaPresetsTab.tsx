'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { deleteAgendaPreset } from '../agenda-presets/actions'
import { AgendaPresetDialog } from '../agenda-presets/AgendaPresetDialog'
import { formatDuration } from '@/lib/utils/format'
import { useDialogState, useConfirmDialog } from '@/lib/hooks'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

interface AgendaPresetsTabProps {
  presets: Preset[]
  ministries: Ministry[]
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export function AgendaPresetsTab({
  presets,
  ministries,
  setPresets,
  setError,
  setSuccess,
}: AgendaPresetsTabProps) {
  const t = useTranslations('settings.presets')
  const editDialog = useDialogState<Preset>()
  const deleteDialog = useConfirmDialog<Preset>()

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return

    deleteDialog.setLoading(true)
    const result = await deleteAgendaPreset(deleteDialog.item.id)

    if (result.error) {
      toast.error(result.error)
      deleteDialog.setLoading(false)
    } else {
      toast.success(t('deleteDialog.deletedSuccess'))
      setPresets(presets.filter(p => p.id !== deleteDialog.item!.id))
      deleteDialog.close()
    }
  }

  const handleSuccess = (preset: Preset, isNew: boolean) => {
    if (isNew) {
      setPresets([...presets, preset].sort((a, b) => a.title.localeCompare(b.title)))
    } else {
      setPresets(presets.map(p => p.id === preset.id ? preset : p))
    }
    editDialog.close()
  }

  return (
    <>
      <Card className="w-full md:min-w-[28rem] border-0 shadow-none !ring-0">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div>
              <CardTitle className="text-lg md:text-xl">{t('title')}</CardTitle>
              <CardDescription className="text-sm">
                {t('description')}
              </CardDescription>
            </div>
            <Button onClick={() => editDialog.open()} className="!rounded-lg !border !border-brand !bg-brand hover:!bg-brand/90 !text-white dark:!text-black shrink-0 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t('addItem')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {presets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('empty.title')}</p>
              <p className="text-sm">{t('empty.description')}</p>
            </div>
          ) : (
            <div className="space-y-1.5 md:space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 md:p-4 border border-black/20 dark:border-white/20 rounded-lg hover:bg-muted/50 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <ListChecks className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="font-medium text-sm md:text-base truncate">{preset.title}</span>
                        <span className="text-[10px] md:text-sm text-muted-foreground">
                          {formatDuration(preset.duration_seconds)}
                        </span>
                        {preset.ministry && (
                          <div className="flex items-center gap-0.5 hidden sm:flex">
                            <div
                              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                              style={{ backgroundColor: preset.ministry.color }}
                            />
                            <span className="text-xs text-muted-foreground">{preset.ministry.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => editDialog.open(preset)}
                    >
                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => deleteDialog.open(preset)}
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <AgendaPresetDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.setOpen}
        preset={editDialog.item}
        ministries={ministries}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={deleteDialog.setOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-950 max-w-[90vw] md:max-w-lg !border !border-black dark:!border-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { title: deleteDialog.item?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel className="!rounded-lg !border-0 bg-white dark:bg-zinc-950 px-4 py-2">{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDialog.isLoading}
              className="!rounded-lg !border !border-red-600 !bg-red-600 hover:!bg-red-700 !text-white px-4 py-2"
            >
              {deleteDialog.isLoading ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
