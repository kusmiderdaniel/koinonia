'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Role } from '../types'

interface RoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRole: Role | null
  roleName: string
  roleDescription: string
  isSaving: boolean
  onRoleNameChange: (name: string) => void
  onRoleDescriptionChange: (description: string) => void
  onSave: () => void
  onCancel: () => void
}

export function RoleDialog({
  open,
  onOpenChange,
  editingRole,
  roleName,
  roleDescription,
  isSaving,
  onRoleNameChange,
  onRoleDescriptionChange,
  onSave,
  onCancel,
}: RoleDialogProps) {
  const t = useTranslations('ministries')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
        <DialogHeader>
          <DialogTitle>{editingRole ? t('roles.editRole') : t('roles.addRole')}</DialogTitle>
          <DialogDescription>
            {editingRole
              ? t('roles.editDescription')
              : t('roles.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">{t('roles.roleNameRequired')}</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => onRoleNameChange(e.target.value)}
              placeholder={t('roles.roleNamePlaceholder')}
              className="!border !border-black/20 dark:!border-white/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleDescription">{t('roles.roleDescription')}</Label>
            <Input
              id="roleDescription"
              value={roleDescription}
              onChange={(e) => onRoleDescriptionChange(e.target.value)}
              placeholder={t('roles.roleDescriptionPlaceholder')}
              className="!border !border-black/20 dark:!border-white/20"
            />
          </div>
        </div>
        <DialogFooter className="!bg-transparent !border-0 !p-0 !mx-0 !mb-0 !mt-6">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-full"
          >
            {t('actions.cancel')}
          </Button>
          <Button
            variant="outline-pill"
            onClick={onSave}
            disabled={isSaving || !roleName.trim()}
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground !border-0"
          >
            {isSaving ? t('actions.saving') : editingRole ? t('actions.saveChanges') : t('roles.addRole')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
