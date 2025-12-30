'use client'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Add Role'}</DialogTitle>
          <DialogDescription>
            {editingRole
              ? 'Update the role details.'
              : 'Create a new role for this ministry.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name *</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => onRoleNameChange(e.target.value)}
              placeholder="e.g., Worship Leader"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleDescription">Description</Label>
            <Input
              id="roleDescription"
              value={roleDescription}
              onChange={(e) => onRoleDescriptionChange(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving || !roleName.trim()}>
            {isSaving ? 'Saving...' : editingRole ? 'Save Changes' : 'Add Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
