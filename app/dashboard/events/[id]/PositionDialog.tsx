'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addEventPosition, updateEventPosition } from '../actions'
import { getMinistries, getMinistryRoles } from '../../ministries/actions'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Role {
  id: string
  name: string
}

interface Position {
  id: string
  title: string
  quantity_needed: number
  notes: string | null
  ministry: {
    id: string
    name: string
    color: string
  }
  role: {
    id: string
    name: string
  } | null
}

interface PositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  position: Position | null
  onSuccess: () => void
}

export function PositionDialog({
  open,
  onOpenChange,
  eventId,
  position,
  onSuccess,
}: PositionDialogProps) {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [ministryId, setMinistryId] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

   
  useEffect(() => {
    if (open) {
      // Load ministries
      getMinistries().then((result) => {
        if (result.data) {
          setMinistries(result.data)
        }
      })

      // Set form values
      if (position) {
        setMinistryId(position.ministry.id)
        setRoleId(position.role?.id || '')
        setTitle(position.title)
        setNotes(position.notes || '')
      } else {
        setMinistryId('')
        setRoleId('')
        setTitle('')
        setNotes('')
      }
      setError(null)
    }
  }, [open, position])

   
  useEffect(() => {
    if (ministryId) {
      getMinistryRoles(ministryId).then((result) => {
        if (result.data) {
          setRoles(result.data)
        } else {
          setRoles([])
        }
      })
    } else {
      setRoles([])
      setRoleId('')
    }
  }, [ministryId])

   
  useEffect(() => {
    if (roleId && !position) {
      const selectedRole = roles.find((r) => r.id === roleId)
      if (selectedRole) {
        setTitle(selectedRole.name)
      }
    }
  }, [roleId, roles, position])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!ministryId) {
      setError('Please select a ministry')
      setIsLoading(false)
      return
    }

    const data = {
      ministryId,
      roleId: roleId || null,
      title,
      quantityNeeded: 1,
      notes: notes || undefined,
    }

    const result = position
      ? await updateEventPosition(position.id, data)
      : await addEventPosition(eventId, data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onSuccess()
    }
  }

  const isEditing = !!position

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Position' : 'Add Position'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the position details.'
              : 'Add a volunteer position to this event.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ministry">Ministry *</Label>
            <Select value={ministryId} onValueChange={setMinistryId}>
              <SelectTrigger className="bg-white dark:bg-zinc-950">
                <SelectValue placeholder="Select a ministry" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950">
                {ministries.map((ministry) => (
                  <SelectItem key={ministry.id} value={ministry.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ministry.color }}
                      />
                      {ministry.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role (optional)</Label>
            <Select
              value={roleId || 'none'}
              onValueChange={(v) => setRoleId(v === 'none' ? '' : v)}
              disabled={!ministryId || roles.length === 0}
            >
              <SelectTrigger className="bg-white dark:bg-zinc-950">
                <SelectValue placeholder={roles.length === 0 ? 'No roles defined' : 'Select a role'} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950">
                <SelectItem value="none">Any role</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecting a role helps filter eligible volunteers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Position Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lead Guitarist"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter className="!bg-transparent !border-0">
            <Button
              type="button"
              variant="outline-pill"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="!border !border-black dark:!border-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim() || !ministryId}
              variant="outline-pill"
              className="!border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
            >
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Adding...'
                : isEditing
                ? 'Save Changes'
                : 'Add Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
