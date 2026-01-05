'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Send, Loader2, Users } from 'lucide-react'
import { useMatrixInvitationsState } from './useMatrixInvitationsState'
import { ScopeSelector } from './ScopeSelector'
import type { MatrixInvitationsDialogProps } from './types'

export function MatrixInvitationsDialog({
  open,
  onOpenChange,
  eventIds,
  onSuccess,
}: MatrixInvitationsDialogProps) {
  const state = useMatrixInvitationsState({
    open,
    eventIds,
    onSuccess,
    onOpenChange,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Invitations
          </DialogTitle>
          <DialogDescription>
            Send invitations to volunteers assigned to positions across multiple
            events.
          </DialogDescription>
        </DialogHeader>

        {state.isLoadingCounts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : state.pendingCounts?.total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending assignments to invite</p>
            <p className="text-xs mt-1">
              All assigned volunteers have already been invited
            </p>
          </div>
        ) : state.pendingCounts ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{state.pendingCounts.total}</strong> volunteer
                {state.pendingCounts.total !== 1 ? 's' : ''} assigned but not yet
                invited across {state.pendingCounts.byEvent.length} event
                {state.pendingCounts.byEvent.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Scope selection */}
            <ScopeSelector
              scope={state.scope}
              onScopeChange={state.setScope}
              pendingCounts={state.pendingCounts}
              selectedEventIds={state.selectedEventIds}
              selectedMinistryIds={state.selectedMinistryIds}
              selectedPositionIds={state.selectedPositionIds}
              onToggleEvent={state.toggleEvent}
              onToggleMinistry={state.toggleMinistry}
              onTogglePosition={state.togglePosition}
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            disabled={state.isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={state.handleSend}
            disabled={state.isSending || !state.canSend}
            className="rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground"
          >
            {state.isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send {state.inviteCount > 0 ? `(${state.inviteCount})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
