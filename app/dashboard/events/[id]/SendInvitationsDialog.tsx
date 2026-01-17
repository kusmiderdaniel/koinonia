'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, Users } from 'lucide-react'
import {
  sendInvitations,
  getPendingInvitationCounts,
  type InvitationScope,
} from '../actions/invitations'
import { toast } from 'sonner'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Position {
  id: string
  title: string
}

interface PendingCounts {
  total: number
  byMinistry: { ministry: Ministry; count: number }[]
  byPosition: { position: Position; count: number }[]
}

interface SendInvitationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess: () => void
}

export function SendInvitationsDialog({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: SendInvitationsDialogProps) {
  const t = useTranslations('events.invitationsDialog')
  const tCommon = useTranslations('common')
  const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  const [scope, setScope] = useState<InvitationScope>('all')
  const [selectedMinistryId, setSelectedMinistryId] = useState<string>('')
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)

  // Fetch pending counts when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingCounts(true)
      setScope('all')
      setSelectedMinistryId('')
      setSelectedPositionIds([])

      getPendingInvitationCounts(eventId).then((result) => {
        if (result.data) {
          setPendingCounts(result.data)
        }
        setIsLoadingCounts(false)
      })
    }
  }, [open, eventId])

  const handleSend = async () => {
    setIsSending(true)

    try {
      const options = {
        eventId,
        scope,
        ministryId: scope === 'ministry' ? selectedMinistryId : undefined,
        positionIds: scope === 'positions' ? selectedPositionIds : undefined,
      }

      const result = await sendInvitations(options)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('invitationsSent', { count: result.data?.invitedCount || 0 }))
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      toast.error(t('sendFailed'))
    } finally {
      setIsSending(false)
    }
  }

  const togglePosition = (positionId: string) => {
    setSelectedPositionIds((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    )
  }

  const getInviteCount = () => {
    if (!pendingCounts) return 0

    if (scope === 'all') {
      return pendingCounts.total
    } else if (scope === 'ministry' && selectedMinistryId) {
      const ministry = pendingCounts.byMinistry.find(
        (m) => m.ministry.id === selectedMinistryId
      )
      return ministry?.count || 0
    } else if (scope === 'positions' && selectedPositionIds.length > 0) {
      return pendingCounts.byPosition
        .filter((p) => selectedPositionIds.includes(p.position.id))
        .reduce((sum, p) => sum + p.count, 0)
    }
    return 0
  }

  const canSend = () => {
    if (!pendingCounts || pendingCounts.total === 0) return false

    if (scope === 'all') return true
    if (scope === 'ministry') return !!selectedMinistryId
    if (scope === 'positions') return selectedPositionIds.length > 0

    return false
  }

  const inviteCount = getInviteCount()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 !border !border-black dark:!border-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('descriptionSingle')}
          </DialogDescription>
        </DialogHeader>

        {isLoadingCounts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingCounts?.total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noPending')}</p>
            <p className="text-xs mt-1">
              {t('allInvited')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('summaryVolunteers', { count: pendingCounts?.total || 0 })}
              </p>
            </div>

            {/* Scope selection */}
            <RadioGroup value={scope} onValueChange={(v: string) => setScope(v as InvitationScope)}>
              {/* All */}
              <div className="flex items-center space-x-2 p-3 border border-input rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900">
                <RadioGroupItem value="all" id="scope-all" />
                <Label htmlFor="scope-all" className="flex-1 cursor-pointer">
                  <span className="font-medium">{t('allPending')}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({pendingCounts?.total})
                  </span>
                </Label>
              </div>

              {/* By Ministry */}
              {pendingCounts && pendingCounts.byMinistry.length > 1 && (
                <div className="border rounded-lg">
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <RadioGroupItem value="ministry" id="scope-ministry" />
                    <Label htmlFor="scope-ministry" className="flex-1 cursor-pointer font-medium">
                      {t('byMinistry')}
                    </Label>
                  </div>

                  {scope === 'ministry' && (
                    <div className="px-3 pb-3 space-y-2">
                      {pendingCounts.byMinistry.map(({ ministry, count }) => (
                        <button
                          key={ministry.id}
                          type="button"
                          className={`w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                            selectedMinistryId === ministry.id
                              ? 'bg-brand/10 border border-brand'
                              : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent'
                          }`}
                          onClick={() => setSelectedMinistryId(ministry.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: ministry.color }}
                            />
                            <span>{ministry.name}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* By Position */}
              {pendingCounts && pendingCounts.byPosition.length > 1 && (
                <div className="border rounded-lg">
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <RadioGroupItem value="positions" id="scope-positions" />
                    <Label htmlFor="scope-positions" className="flex-1 cursor-pointer font-medium">
                      {t('byPosition')}
                    </Label>
                  </div>

                  {scope === 'positions' && (
                    <ScrollArea className="max-h-40 px-3 pb-3">
                      <div className="space-y-2">
                        {pendingCounts.byPosition.map(({ position, count }) => (
                          <div
                            key={position.id}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Checkbox
                              id={`position-${position.id}`}
                              checked={selectedPositionIds.includes(position.id)}
                              onCheckedChange={() => togglePosition(position.id)}
                            />
                            <Label
                              htmlFor={`position-${position.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {position.title}
                            </Label>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </RadioGroup>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline-pill"
            className="flex-1 sm:flex-none !border-0"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            {tCommon('buttons.cancel')}
          </Button>
          <Button
            variant="outline-pill"
            onClick={handleSend}
            disabled={isSending || !canSend()}
            className="flex-1 sm:flex-none !bg-brand hover:!bg-brand/90 !text-brand-foreground !border-brand"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('sending')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('send')} {inviteCount > 0 ? `(${inviteCount})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
