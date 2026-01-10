'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getMinistriesWithRoles, addMultiplePositions } from '../actions'

interface Ministry {
  id: string
  name: string
  color: string
  ministry_roles: {
    id: string
    name: string
    sort_order: number | null
  }[]
}

interface SelectedRole {
  ministryId: string
  roleId: string
  roleName: string
}

interface ExistingPosition {
  ministry_id: string
  role_id: string | null
}

interface PositionPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  existingPositions?: ExistingPosition[]
  onSuccess: () => void
}

export function PositionPicker({
  open,
  onOpenChange,
  eventId,
  existingPositions = [],
  onSuccess,
}: PositionPickerProps) {
  const t = useTranslations('events.positionPicker')
  const tCommon = useTranslations('common.buttons')
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedRoles, setSelectedRoles] = useState<SelectedRole[]>([])
  const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadMinistries()
      setSelectedRoles([])
      setError(null)
    }
  }, [open])

  const loadMinistries = async () => {
    setIsLoading(true)
    const result = await getMinistriesWithRoles()
    if (result.data) {
      setMinistries(result.data)
      // Expand all ministries by default
      setExpandedMinistries(new Set(result.data.map(m => m.id)))
    } else if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  const toggleMinistryExpanded = (ministryId: string) => {
    setExpandedMinistries(prev => {
      const next = new Set(prev)
      if (next.has(ministryId)) {
        next.delete(ministryId)
      } else {
        next.add(ministryId)
      }
      return next
    })
  }

  const toggleRole = (ministry: Ministry, role: Ministry['ministry_roles'][0]) => {
    const key = `${ministry.id}:${role.id}`
    const existing = selectedRoles.find(
      (r) => r.ministryId === ministry.id && r.roleId === role.id
    )

    if (existing) {
      setSelectedRoles(selectedRoles.filter(
        (r) => !(r.ministryId === ministry.id && r.roleId === role.id)
      ))
    } else {
      setSelectedRoles([
        ...selectedRoles,
        {
          ministryId: ministry.id,
          roleId: role.id,
          roleName: role.name,
        },
      ])
    }
  }

  const isRoleSelected = (ministryId: string, roleId: string) => {
    return selectedRoles.some(
      (r) => r.ministryId === ministryId && r.roleId === roleId
    )
  }

  const isRoleAlreadyAdded = (ministryId: string, roleId: string) => {
    return existingPositions.some(
      (p) => p.ministry_id === ministryId && p.role_id === roleId
    )
  }

  const handleAdd = async () => {
    if (selectedRoles.length === 0) return

    setIsAdding(true)
    setError(null)

    const result = await addMultiplePositions(eventId, selectedRoles)

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
      return
    }

    setIsAdding(false)
    onSuccess()
  }

  const totalRoles = ministries.reduce(
    (sum, m) => sum + (m.ministry_roles?.length || 0),
    0
  )

  // Count available roles (excluding already added ones)
  const availableRolesCount = ministries.reduce(
    (sum, m) => {
      const available = m.ministry_roles?.filter(
        (role) => !isRoleAlreadyAdded(m.id, role.id)
      ).length || 0
      return sum + available
    },
    0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-950 max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('loading')}
          </div>
        ) : ministries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('noMinistries')}
          </div>
        ) : totalRoles === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('noRoles')}
          </div>
        ) : availableRolesCount === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('allRolesAdded')}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="h-[350px] overflow-y-auto p-4">
              <div className="space-y-6">
              {ministries.map((ministry) => {
                if (!ministry.ministry_roles || ministry.ministry_roles.length === 0) {
                  return null
                }

                // Filter out roles that are already added to the event
                const availableRoles = ministry.ministry_roles.filter(
                  (role) => !isRoleAlreadyAdded(ministry.id, role.id)
                )

                // Skip ministry if all roles are already added
                if (availableRoles.length === 0) {
                  return null
                }

                const isExpanded = expandedMinistries.has(ministry.id)

                return (
                  <div key={ministry.id}>
                    <button
                      type="button"
                      onClick={() => toggleMinistryExpanded(ministry.id)}
                      className="flex items-center gap-2 mb-3 w-full text-left hover:opacity-70 transition-opacity"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ministry.color }}
                      />
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        {ministry.name}
                      </h3>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({availableRoles.length})
                      </span>
                    </button>
                    {isExpanded && (
                    <div className="space-y-2 pl-6">
                      {availableRoles.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={isRoleSelected(ministry.id, role.id)}
                            onCheckedChange={() => toggleRole(ministry, role)}
                          />
                          <span className="font-medium">{role.name}</span>
                        </label>
                      ))}
                    </div>
                    )}
                  </div>
                )
              })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
          <Button
            variant="outline-pill"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
            className="!border !border-black dark:!border-white"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding || selectedRoles.length === 0}
            variant="outline-pill"
            className="!border !bg-brand hover:!bg-brand/90 !text-white !border-brand disabled:!opacity-50"
          >
            {isAdding
              ? t('adding')
              : selectedRoles.length === 0
              ? t('selectRoles')
              : selectedRoles.length === 1
              ? t('addCount', { count: selectedRoles.length })
              : t('addCountPlural', { count: selectedRoles.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
