'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Users } from 'lucide-react'
import { getMinistries, addTemplatePositions } from './actions'

interface Role {
  id: string
  name: string
}

interface Ministry {
  id: string
  name: string
  ministry_roles: Role[]
}

interface ExistingPosition {
  ministry_id: string
  role_id: string | null
  title: string
}

interface TemplatePositionPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  existingPositions: ExistingPosition[]
  onSuccess: () => void
}

interface SelectedPosition {
  ministryId: string
  roleId: string
  roleName: string
}

export function TemplatePositionPicker({
  open,
  onOpenChange,
  templateId,
  existingPositions,
  onSuccess,
}: TemplatePositionPickerProps) {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedPositions, setSelectedPositions] = useState<SelectedPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadMinistries()
      setSelectedPositions([])
      setError(null)
    }
  }, [open])

  const loadMinistries = async () => {
    const result = await getMinistries()
    if (result.data) {
      setMinistries(result.data)
    }
  }

  const isPositionAlreadyAdded = (ministryId: string, roleId: string) => {
    return existingPositions.some(
      (p) => p.ministry_id === ministryId && p.role_id === roleId
    )
  }

  const isPositionSelected = (ministryId: string, roleId: string) => {
    return selectedPositions.some(
      (p) => p.ministryId === ministryId && p.roleId === roleId
    )
  }

  const togglePosition = (ministryId: string, roleId: string, roleName: string) => {
    setSelectedPositions((prev) => {
      const exists = prev.some(
        (p) => p.ministryId === ministryId && p.roleId === roleId
      )
      if (exists) {
        return prev.filter(
          (p) => !(p.ministryId === ministryId && p.roleId === roleId)
        )
      } else {
        return [...prev, { ministryId, roleId, roleName }]
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedPositions.length === 0) return

    setIsLoading(true)
    setError(null)

    const result = await addTemplatePositions(templateId, selectedPositions)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      onSuccess()
    }
  }

  const ministriesWithRoles = ministries.filter(
    (m) => m.ministry_roles && m.ministry_roles.length > 0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle>Add Positions</DialogTitle>
          <DialogDescription>
            Select positions from ministries to add to this template.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {ministriesWithRoles.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No ministries with roles found.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create ministry roles first in the Ministries section.
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Accordion type="multiple" className="w-full">
                {ministriesWithRoles.map((ministry) => (
                  <AccordionItem key={ministry.id} value={ministry.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ministry.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({ministry.ministry_roles.length} roles)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {ministry.ministry_roles.map((role) => {
                          const alreadyAdded = isPositionAlreadyAdded(
                            ministry.id,
                            role.id
                          )
                          const isSelected = isPositionSelected(ministry.id, role.id)

                          return (
                            <div
                              key={role.id}
                              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                alreadyAdded
                                  ? 'opacity-50'
                                  : isSelected
                                  ? 'bg-brand/10'
                                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                              }`}
                            >
                              <Checkbox
                                id={`${ministry.id}-${role.id}`}
                                checked={isSelected}
                                disabled={alreadyAdded}
                                onCheckedChange={() =>
                                  togglePosition(ministry.id, role.id, role.name)
                                }
                              />
                              <Label
                                htmlFor={`${ministry.id}-${role.id}`}
                                className={`flex-1 cursor-pointer ${
                                  alreadyAdded ? 'cursor-not-allowed' : ''
                                }`}
                              >
                                {role.name}
                                {alreadyAdded && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (already added)
                                  </span>
                                )}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 border-0 bg-transparent">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || selectedPositions.length === 0}
            className="rounded-full bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {isLoading
              ? 'Adding...'
              : `Add ${selectedPositions.length} Position${
                  selectedPositions.length !== 1 ? 's' : ''
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
