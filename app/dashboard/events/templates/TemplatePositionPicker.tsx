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
import { Users, ChevronDown, ChevronRight } from 'lucide-react'
import { getMinistries, addTemplatePositions } from './actions'

interface Role {
  id: string
  name: string
}

interface Ministry {
  id: string
  name: string
  color: string
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
  const t = useTranslations('events.templatePositionPicker')
  const tCommon = useTranslations('common')
  const tTemplates = useTranslations('events.templatesTab')
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedPositions, setSelectedPositions] = useState<SelectedPosition[]>([])
  const [expandedMinistries, setExpandedMinistries] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMinistries = async () => {
    setIsLoading(true)
    const result = await getMinistries()
    if (result.data) {
      const ministryData = result.data as Ministry[]
      setMinistries(ministryData)
      // Expand all ministries by default
      setExpandedMinistries(new Set(ministryData.map(m => m.id)))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadMinistries()
      setSelectedPositions([])
      setError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

    setIsAdding(true)
    setError(null)

    const result = await addTemplatePositions(templateId, selectedPositions)

    if (result.error) {
      setError(result.error)
      setIsAdding(false)
    } else {
      setIsAdding(false)
      onSuccess()
    }
  }

  const ministriesWithRoles = ministries.filter(
    (m) => m.ministry_roles && m.ministry_roles.length > 0
  )

  const totalRoles = ministriesWithRoles.reduce(
    (sum, m) => sum + (m.ministry_roles?.length || 0),
    0
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
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
        ) : ministriesWithRoles.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t('noMinistriesFound')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('createRolesHint')}
            </p>
          </div>
        ) : totalRoles === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('noRolesDefined')}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="h-[350px] overflow-y-auto p-4">
              <div className="space-y-6">
              {ministriesWithRoles.map((ministry) => {
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
                      style={{ backgroundColor: ministry.color || '#6b7280' }}
                    />
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      {ministry.name}
                    </h3>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({ministry.ministry_roles.length})
                    </span>
                  </button>
                  {isExpanded && (
                  <div className="space-y-2 pl-6">
                    {ministry.ministry_roles.map((role) => {
                      const alreadyAdded = isPositionAlreadyAdded(
                        ministry.id,
                        role.id
                      )
                      const isSelected = isPositionSelected(ministry.id, role.id)

                      return (
                        <label
                          key={role.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            alreadyAdded
                              ? 'opacity-50 cursor-not-allowed bg-muted/30'
                              : isSelected
                              ? 'bg-brand/10 border-brand/30'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={alreadyAdded}
                            onCheckedChange={() =>
                              togglePosition(ministry.id, role.id, role.name)
                            }
                          />
                          <span className={`font-medium ${alreadyAdded ? 'text-muted-foreground' : ''}`}>
                            {role.name}
                          </span>
                          {alreadyAdded && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              {tTemplates('alreadyAdded')}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                  )}
                </div>
              )})}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
          <Button
            variant="outline-pill-muted"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            {tCommon('buttons.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isAdding || selectedPositions.length === 0}
            className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
          >
            {isAdding
              ? t('adding')
              : selectedPositions.length === 0
              ? t('selectRoles')
              : selectedPositions.length === 1
              ? t('addCount', { count: 1 })
              : t('addCountPlural', { count: selectedPositions.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
