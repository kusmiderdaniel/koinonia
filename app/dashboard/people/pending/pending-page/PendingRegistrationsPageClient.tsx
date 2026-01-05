'use client'

import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePendingRegistrationsState } from './usePendingRegistrationsState'
import { RegistrationsTable } from './RegistrationsTable'
import { RejectDialog } from './RejectDialog'
import { LinkDialog } from './LinkDialog'

export function PendingRegistrationsPageClient() {
  const state = usePendingRegistrationsState()

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/people">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pending Registrations</h1>
          <p className="text-muted-foreground">
            Review and approve new member registrations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Awaiting Approval
          </CardTitle>
          <CardDescription>
            {state.registrations.length} registration
            {state.registrations.length !== 1 ? 's' : ''} pending review
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

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
