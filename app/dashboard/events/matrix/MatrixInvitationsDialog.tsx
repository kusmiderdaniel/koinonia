'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
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
import { Send, Loader2, Users, Calendar, Users2, Briefcase } from 'lucide-react'
import {
  sendBulkInvitations,
  getMatrixPendingInvitationCounts,
  type BulkInvitationScope,
} from '../actions/invitations'
import { toast } from 'sonner'

interface Event {
  id: string
  title: string
  start_time: string
}

interface Ministry {
  id: string
  name: string
  color: string
}

interface Position {
  id: string
  title: string
  eventId: string
  ministry: Ministry | null
}

interface PendingCounts {
  total: number
  byEvent: { event: Event; count: number }[]
  byMinistry: { ministry: Ministry; count: number }[]
  byPosition: { position: Position; count: number }[]
}

interface MatrixInvitationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventIds: string[]
  onSuccess: () => void
}

export function MatrixInvitationsDialog({
  open,
  onOpenChange,
  eventIds,
  onSuccess,
}: MatrixInvitationsDialogProps) {
  const [pendingCounts, setPendingCounts] = useState<PendingCounts | null>(null)
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  const [scope, setScope] = useState<BulkInvitationScope>('all')
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>([])
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)

  // Fetch pending counts when dialog opens
  useEffect(() => {
    if (open && eventIds.length > 0) {
      setIsLoadingCounts(true)
      setScope('all')
      setSelectedEventIds([])
      setSelectedMinistryIds([])
      setSelectedPositionIds([])

      getMatrixPendingInvitationCounts(eventIds).then((result) => {
        if (result.data) {
          setPendingCounts(result.data)
        }
        setIsLoadingCounts(false)
      })
    }
  }, [open, eventIds])

  const handleSend = async () => {
    setIsSending(true)

    try {
      const options = {
        eventIds,
        scope,
        selectedEventIds: scope === 'events' ? selectedEventIds : undefined,
        selectedMinistryIds: scope === 'ministries' ? selectedMinistryIds : undefined,
        selectedPositionIds: scope === 'positions' ? selectedPositionIds : undefined,
      }

      const result = await sendBulkInvitations(options)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${result.data?.invitedCount} invitation(s) sent!`)
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      toast.error('Failed to send invitations')
    } finally {
      setIsSending(false)
    }
  }

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    )
  }

  const toggleMinistry = (ministryId: string) => {
    setSelectedMinistryIds((prev) =>
      prev.includes(ministryId)
        ? prev.filter((id) => id !== ministryId)
        : [...prev, ministryId]
    )
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
    } else if (scope === 'events' && selectedEventIds.length > 0) {
      return pendingCounts.byEvent
        .filter((e) => selectedEventIds.includes(e.event.id))
        .reduce((sum, e) => sum + e.count, 0)
    } else if (scope === 'ministries' && selectedMinistryIds.length > 0) {
      return pendingCounts.byMinistry
        .filter((m) => selectedMinistryIds.includes(m.ministry.id))
        .reduce((sum, m) => sum + m.count, 0)
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
    if (scope === 'events') return selectedEventIds.length > 0
    if (scope === 'ministries') return selectedMinistryIds.length > 0
    if (scope === 'positions') return selectedPositionIds.length > 0

    return false
  }

  const inviteCount = getInviteCount()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Invitations
          </DialogTitle>
          <DialogDescription>
            Send invitations to volunteers assigned to positions across multiple events.
          </DialogDescription>
        </DialogHeader>

        {isLoadingCounts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingCounts?.total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending assignments to invite</p>
            <p className="text-xs mt-1">
              All assigned volunteers have already been invited
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{pendingCounts?.total}</strong> volunteer
                {pendingCounts?.total !== 1 ? 's' : ''} assigned but not yet invited
                {' '}across {pendingCounts?.byEvent.length} event{pendingCounts?.byEvent.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Scope selection */}
            <RadioGroup value={scope} onValueChange={(v: string) => setScope(v as BulkInvitationScope)}>
              {/* All */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900">
                <RadioGroupItem value="all" id="scope-all" />
                <Label htmlFor="scope-all" className="flex-1 cursor-pointer">
                  <span className="font-medium">All pending</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({pendingCounts?.total})
                  </span>
                </Label>
              </div>

              {/* By Event/Date */}
              {pendingCounts && pendingCounts.byEvent.length > 1 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <RadioGroupItem value="events" id="scope-events" />
                    <Label htmlFor="scope-events" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      By date
                    </Label>
                  </div>

                  {scope === 'events' && (
                    <ScrollArea className="max-h-40 px-3 pb-3">
                      <div className="space-y-2">
                        {pendingCounts.byEvent.map(({ event, count }) => (
                          <div
                            key={event.id}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Checkbox
                              id={`event-${event.id}`}
                              checked={selectedEventIds.includes(event.id)}
                              onCheckedChange={() => toggleEvent(event.id)}
                            />
                            <Label
                              htmlFor={`event-${event.id}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              <span className="font-medium">
                                {format(new Date(event.start_time), 'MMM d')}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                {event.title}
                              </span>
                            </Label>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* By Ministry */}
              {pendingCounts && pendingCounts.byMinistry.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <RadioGroupItem value="ministries" id="scope-ministries" />
                    <Label htmlFor="scope-ministries" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                      <Users2 className="w-4 h-4" />
                      By ministry
                    </Label>
                  </div>

                  {scope === 'ministries' && (
                    <ScrollArea className="max-h-40 px-3 pb-3">
                      <div className="space-y-2">
                        {pendingCounts.byMinistry.map(({ ministry, count }) => (
                          <div
                            key={ministry.id}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            <Checkbox
                              id={`ministry-${ministry.id}`}
                              checked={selectedMinistryIds.includes(ministry.id)}
                              onCheckedChange={() => toggleMinistry(ministry.id)}
                            />
                            <Label
                              htmlFor={`ministry-${ministry.id}`}
                              className="flex-1 cursor-pointer text-sm flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: ministry.color }}
                              />
                              {ministry.name}
                            </Label>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* By Position/Role */}
              {pendingCounts && pendingCounts.byPosition.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center space-x-2 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900">
                    <RadioGroupItem value="positions" id="scope-positions" />
                    <Label htmlFor="scope-positions" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      By role
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
                              className="flex-1 cursor-pointer text-sm flex items-center gap-2"
                            >
                              {position.ministry && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: position.ministry.color }}
                                  title={position.ministry.name}
                                />
                              )}
                              <span>{position.title}</span>
                              {position.ministry && (
                                <span className="text-xs text-muted-foreground">
                                  ({position.ministry.name})
                                </span>
                              )}
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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !canSend()}
            className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send {inviteCount > 0 ? `(${inviteCount})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
