'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Building2, Plus, Pencil, Trash2, Star } from 'lucide-react'
import type { useCampusManager } from '../hooks'
import type { Campus } from '../actions'

// Predefined color options for campuses
const CAMPUS_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

interface CampusesTabProps {
  campuses: Campus[]
  campusManager: ReturnType<typeof useCampusManager>
  setCampuses: (campuses: Campus[]) => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const CampusesTab = memo(function CampusesTab({
  campuses,
  campusManager,
  setCampuses,
  setError,
  setSuccess,
}: CampusesTabProps) {
  const t = useTranslations('settings.campuses')
  return (
    <>
      <Card className="w-full md:min-w-[28rem]">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div>
              <CardTitle className="text-lg md:text-xl">{t('title')}</CardTitle>
              <CardDescription className="text-sm">
                {t('description')}
              </CardDescription>
            </div>
            <Button onClick={() => campusManager.openCampusDialog()} className="!rounded-lg !border !border-brand !bg-brand hover:!bg-brand/90 !text-black shrink-0 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t('addCampus')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {campuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('empty.title')}</p>
              <p className="text-sm">{t('empty.description')}</p>
            </div>
          ) : (
            <div className="space-y-1.5 md:space-y-2">
              {campuses.map((campus) => (
                <div
                  key={campus.id}
                  className="flex items-center justify-between p-2 md:p-4 border border-black/20 dark:border-white/20 rounded-lg hover:bg-muted/50 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div
                      className="w-4 h-4 md:w-5 md:h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: campus.color }}
                    />
                    <span className="font-medium text-sm md:text-base truncate">{campus.name}</span>
                    {campus.is_default && (
                      <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 py-0 h-5">
                        <Star className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                        {t('default')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center shrink-0">
                    {!campus.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          campusManager.handleSetDefault(campus.id, setCampuses, setError, setSuccess)
                        }
                        className="text-[10px] md:text-xs h-7 md:h-8 px-2 hidden sm:flex"
                      >
                        {t('setDefault')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => campusManager.openCampusDialog(campus)}
                      aria-label={t('editCampus')}
                    >
                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => campusManager.openDeleteCampusDialog(campus)}
                      disabled={campus.is_default || campuses.length <= 1}
                      aria-label={t('deleteCampus')}
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

      {/* Add/Edit Campus Dialog */}
      <AlertDialog
        open={campusManager.campusDialogOpen}
        onOpenChange={(open) => !open && campusManager.closeCampusDialog()}
      >
        <AlertDialogContent className="bg-white dark:bg-zinc-950 max-w-[90vw] md:max-w-lg overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {campusManager.editingCampus ? t('dialog.editTitle') : t('dialog.addTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {campusManager.editingCampus
                ? t('dialog.editDescription')
                : t('dialog.addDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
            {/* Campus Name */}
            <div className="space-y-2">
              <Label htmlFor="campusName">{t('dialog.nameLabel')}</Label>
              <Input
                id="campusName"
                value={campusManager.campusName}
                onChange={(e) => campusManager.setCampusName(e.target.value)}
                placeholder={t('dialog.namePlaceholder')}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>{t('dialog.colorLabel')}</Label>
              <div className="flex flex-wrap gap-2 justify-center">
                {CAMPUS_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      campusManager.campusColor === color
                        ? 'ring-2 ring-offset-2 ring-black dark:ring-white'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => campusManager.setCampusColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Is Default - only show when editing a non-default campus */}
            {campusManager.editingCampus && !campusManager.editingCampus.is_default && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="campusIsDefault" className="text-base">{t('dialog.isDefaultLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('dialog.isDefaultHint')}
                  </p>
                </div>
                <Switch
                  id="campusIsDefault"
                  checked={campusManager.campusIsDefault}
                  onCheckedChange={campusManager.setCampusIsDefault}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel disabled={campusManager.isSavingCampus} className="rounded-full !border-0 bg-white dark:bg-zinc-950 px-4 py-2">{t('dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                campusManager.handleSaveCampus(campuses, setCampuses, setError, setSuccess)
              }
              disabled={campusManager.isSavingCampus || !campusManager.campusName.trim()}
              className="!rounded-lg !border !border-brand !bg-brand hover:!bg-brand/90 !text-black px-4 py-2 disabled:!opacity-50"
            >
              {campusManager.isSavingCampus
                ? t('dialog.saving')
                : campusManager.editingCampus
                  ? t('dialog.saveChanges')
                  : t('dialog.addButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Campus Confirmation */}
      <AlertDialog
        open={campusManager.deleteCampusDialogOpen}
        onOpenChange={(open) => !open && campusManager.closeDeleteCampusDialog()}
      >
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg !border !border-black dark:!border-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { name: campusManager.campusToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel className="!rounded-lg !border-0 bg-white dark:bg-zinc-950 px-4 py-2">{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                campusManager.handleDeleteCampus(campuses, setCampuses, setError, setSuccess)
              }
              className="!rounded-lg !border !border-red-600 !bg-red-600 hover:!bg-red-700 !text-black px-4 py-2"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
