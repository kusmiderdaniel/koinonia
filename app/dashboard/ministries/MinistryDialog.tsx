'use client'

import { useState, useEffect, memo, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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
import { createMinistry, updateMinistry, getChurchLeaders, getMinistries, getCampuses } from './actions'
import { LeaderPicker } from './LeaderPicker'
import { SingleCampusPicker } from '@/components/CampusPicker'
import { useIsMobile } from '@/lib/hooks'

interface Leader {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
  campus_ids: string[]
}

interface Campus {
  id: string
  name: string
  color: string
  is_default: boolean
}

interface Ministry {
  id: string
  name: string
  description: string | null
  color: string
  leader_id: string | null
  campus_id: string | null
  is_active?: boolean
  created_at?: string
  leader: {
    id: string
    first_name: string
    last_name: string
    email: string | null
  } | null
  campus: {
    id: string
    name: string
    color: string
  } | null
}

interface MinistryBasic {
  id: string
  name: string
  leader_id: string | null
}

interface MinistryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ministry: Ministry | null
  onSuccess: (newMinistryId?: string) => void
}

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
]

export const MinistryDialog = memo(function MinistryDialog({ open, onOpenChange, ministry, onSuccess }: MinistryDialogProps) {
  const t = useTranslations('ministries')
  const isMobile = useIsMobile()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [leaderId, setLeaderId] = useState<string>('')
  const [campusId, setCampusId] = useState<string | null>(null)
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [allMinistries, setAllMinistries] = useState<MinistryBasic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      // Load leaders, ministries, and campuses
      getChurchLeaders().then((result) => {
        if (result.data) {
          setLeaders(result.data)
        }
      })
      getMinistries().then((result) => {
        if (result.data) {
          setAllMinistries(result.data.map((m: Ministry) => ({
            id: m.id,
            name: m.name,
            leader_id: m.leader_id,
          })))
        }
      })
      getCampuses().then((result) => {
        if (result.data) {
          setCampuses(result.data)
          // Set default campus for new ministries
          if (!ministry) {
            const defaultCampus = result.data.find((c: Campus) => c.is_default)
            if (defaultCampus) {
              setCampusId(defaultCampus.id)
            }
          }
        }
      })

      // Set form values
      if (ministry) {
        setName(ministry.name)
        setDescription(ministry.description || '')
        setColor(ministry.color)
        setLeaderId(ministry.leader?.id || '')
        setCampusId(ministry.campus_id || null)
      } else {
        setName('')
        setDescription('')
        setColor('#3B82F6')
        setLeaderId('')
        // campusId will be set by getCampuses callback above
      }
      setError(null)
    }
  }, [open, ministry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const data = {
      name,
      description: description || undefined,
      color,
      leaderId: leaderId || null,
      campusId: campusId,
    }

    const result = ministry
      ? await updateMinistry(ministry.id, data)
      : await createMinistry(data)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      // Pass the new ministry ID for auto-selection
      const newMinistryId = !ministry && 'data' in result && result.data ? result.data.id : undefined
      onSuccess(newMinistryId)
    }
  }

  const isEditing = !!ministry

  // Filter leaders by selected campus (or show all if no campus selected)
  // Show leaders who have no campus (church-wide) or belong to the selected campus
  const filteredLeaders = useMemo(() => {
    if (!campusId) return leaders
    return leaders.filter(leader =>
      leader.campus_ids.length === 0 || leader.campus_ids.includes(campusId)
    )
  }, [leaders, campusId])

  // Clear leader selection if they don't belong to the selected campus
  useEffect(() => {
    if (campusId && leaderId) {
      const selectedLeader = leaders.find(l => l.id === leaderId)
      if (selectedLeader && selectedLeader.campus_ids.length > 0 && !selectedLeader.campus_ids.includes(campusId)) {
        setLeaderId('')
      }
    }
  }, [campusId, leaderId, leaders])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md !border !border-black dark:!border-white ${isMobile ? 'max-h-[90vh] overflow-y-auto' : ''}`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('dialog.editTitle') : t('dialog.createTitle')}</DialogTitle>
          {!isMobile && (
            <DialogDescription>
              {isEditing
                ? t('dialog.editDescription')
                : t('dialog.createDescription')}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className={isMobile ? 'space-y-3' : 'space-y-4'}>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label htmlFor="name" className={isMobile ? 'text-sm' : ''}>{t('fields.nameRequired')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fields.namePlaceholder')}
              required
              className={`${isMobile ? 'h-9' : ''} !border !border-black/20 dark:!border-white/20`}
            />
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label htmlFor="description" className={isMobile ? 'text-sm' : ''}>{t('fields.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('fields.descriptionPlaceholder')}
              rows={isMobile ? 2 : 3}
              className={`${isMobile ? 'text-sm' : ''} !border !border-black/20 dark:!border-white/20`}
            />
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label className={isMobile ? 'text-sm' : ''}>{t('fields.color')}</Label>
            <div className={`flex justify-between ${isMobile ? 'gap-1' : 'gap-2'}`}>
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`rounded-full transition-all ${
                    isMobile ? 'w-7 h-7' : 'w-8 h-8'
                  } ${
                    color === presetColor
                      ? 'ring-2 ring-offset-2 ring-gray-400'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label className={isMobile ? 'text-sm' : ''}>{t('fields.campus')}</Label>
            <SingleCampusPicker
              campuses={campuses}
              selectedCampusId={campusId}
              onChange={setCampusId}
              placeholder={t('fields.allCampuses')}
            />
            {!isMobile && (
              <p className="text-sm text-muted-foreground">
                {t('fields.campusHint')}
              </p>
            )}
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label className={isMobile ? 'text-sm' : ''}>{t('fields.leaderRequired')}</Label>
            <LeaderPicker
              selectedLeaderId={leaderId}
              onSelect={setLeaderId}
              leaders={filteredLeaders}
              ministries={allMinistries}
              currentMinistryId={ministry?.id}
            />
            {!isEditing && !leaderId && !isMobile && (
              <p className="text-sm text-muted-foreground">
                {t('fields.leaderHint')}
              </p>
            )}
          </div>

          <DialogFooter className={`!bg-transparent !border-0 !p-0 !mx-0 !mb-0 ${isMobile ? '!mt-4' : '!mt-6'}`}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full"
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="outline-pill"
              disabled={isLoading || !name.trim() || (!isEditing && !leaderId)}
              className="!bg-brand hover:!bg-brand/90 !text-black !border-brand"
            >
              {isLoading
                ? isEditing
                  ? t('actions.saving')
                  : t('actions.creating')
                : isEditing
                ? t('actions.saveChanges')
                : t('actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
