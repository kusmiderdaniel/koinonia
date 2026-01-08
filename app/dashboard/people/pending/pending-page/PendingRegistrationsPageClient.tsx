'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePendingRegistrationsState } from './usePendingRegistrationsState'
import { RegistrationsTable } from './RegistrationsTable'
import { RejectDialog } from './RejectDialog'
import { LinkDialog } from './LinkDialog'

export function PendingRegistrationsPageClient() {
  const state = usePendingRegistrationsState()

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
              <Link href="/dashboard/people">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Pending Registrations</h1>
                {state.registrations.length > 0 && (
                  <Badge variant="destructive" className="bg-red-500 text-white rounded-full">
                    {state.registrations.length}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Review and approve new member registrations
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <RegistrationsTable
            registrations={state.registrations}
            offlineMembers={state.offlineMembers}
            isAdmin={state.isAdmin}
            loading={state.loading}
            actionLoading={state.actionLoading}
            onApprove={state.handleApprove}
            onReject={state.openRejectDialog}
            onLink={state.openLinkDialog}
          />
        </div>
      </div>

      <RejectDialog
        open={state.rejectDialogOpen}
        onOpenChange={state.setRejectDialogOpen}
        registration={state.selectedRegistration}
        rejectReason={state.rejectReason}
        onRejectReasonChange={state.setRejectReason}
        onConfirm={state.handleReject}
      />

      <LinkDialog
        open={state.linkDialogOpen}
        onOpenChange={state.setLinkDialogOpen}
        registration={state.selectedRegistration}
        filteredOfflineMembers={state.filteredOfflineMembers}
        selectedProfileId={state.selectedProfileId}
        memberSearch={state.memberSearch}
        onSelectedProfileIdChange={state.setSelectedProfileId}
        onMemberSearchChange={state.setMemberSearch}
        onConfirm={state.handleLink}
      />
    </div>
  )
}
