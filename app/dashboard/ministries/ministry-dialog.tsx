'use client'

import { useState, useEffect, memo } from 'react'
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
import { LeaderPicker } from './leader-picker'
import { SingleCampusPicker } from '@/components/CampusPicker'

interface Leader {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
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
        setCampusId(null)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Ministry' : 'Create Ministry'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the ministry details below.'
              : 'Add a new ministry team to your church.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Ministry Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Worship Team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this ministry..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === presetColor
                      ? 'ring-2 ring-offset-2 ring-gray-400'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ministry Leader *</Label>
            <LeaderPicker
              selectedLeaderId={leaderId}
              onSelect={setLeaderId}
              leaders={leaders}
              ministries={allMinistries}
              currentMinistryId={ministry?.id}
            />
            {!isEditing && !leaderId && (
              <p className="text-sm text-muted-foreground">
                A leader must be assigned to create a ministry
              </p>
            )}
          </div>

          {campuses.length > 1 && (
            <div className="space-y-2">
              <Label>Campus</Label>
              <SingleCampusPicker
                campuses={campuses}
                selectedCampusId={campusId}
                onChange={setCampusId}
                placeholder="All campuses"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty for a church-wide ministry
              </p>
            </div>
          )}

          <DialogFooter className="!bg-transparent !border-0 !p-0 !mx-0 !mb-0 !mt-6">
            <Button
              type="button"
              variant="outline-pill"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="!border !border-gray-300 dark:!border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || (!isEditing && !leaderId)}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white"
            >
              {isLoading
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                ? 'Save Changes'
                : 'Create Ministry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})
