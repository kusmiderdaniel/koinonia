'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { useOwnershipTransfer } from '../hooks'

interface TransferOwnershipTabProps {
  ownershipTransfer: ReturnType<typeof useOwnershipTransfer>
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const TransferOwnershipTab = memo(function TransferOwnershipTab({
  ownershipTransfer,
  setError,
  setSuccess,
}: TransferOwnershipTabProps) {
  return (
    <Card className="min-w-[28rem] border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-700">Transfer Ownership</CardTitle>
        <CardDescription>
          Transfer ownership of this church to an admin. This action cannot be undone. You will
          become an admin after transferring ownership.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ownershipTransfer.adminMembers.length === 0 ? (
          <Alert>
            <AlertDescription>
              No admins available to transfer ownership to. Promote a member to admin first from the
              People page.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select New Owner</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Only admins can become the new owner. Click to select.
              </p>
              <div className="space-y-2">
                {ownershipTransfer.adminMembers.map((member) => {
                  const isSelected = ownershipTransfer.selectedNewOwner === member.id
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        ownershipTransfer.setSelectedNewOwner(isSelected ? '' : member.id)
                      }
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                          : 'border-border hover:border-orange-300 hover:bg-muted/50'
                      }`}
                    >
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                      {member.email && (
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <AlertDialog
              open={ownershipTransfer.transferDialogOpen}
              onOpenChange={ownershipTransfer.setTransferDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="!rounded-full border-orange-500 text-orange-700 hover:bg-orange-50"
                  disabled={!ownershipTransfer.selectedNewOwner || ownershipTransfer.isTransferring}
                >
                  Transfer Ownership
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Transfer Church Ownership?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to transfer ownership to{' '}
                    <strong>
                      {ownershipTransfer.selectedMember?.first_name}{' '}
                      {ownershipTransfer.selectedMember?.last_name}
                    </strong>
                    . This action cannot be undone. You will become an admin and lose owner
                    privileges.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
                  <AlertDialogCancel disabled={ownershipTransfer.isTransferring} className="rounded-full border-black dark:border-white bg-white dark:bg-zinc-950 px-4 py-2">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      ownershipTransfer.handleTransferOwnership(setError, setSuccess, () => {})
                    }
                    disabled={ownershipTransfer.isTransferring}
                    className="!rounded-full !bg-orange-600 hover:!bg-orange-700 !text-white !px-4 !py-2 disabled:!opacity-50"
                  >
                    {ownershipTransfer.isTransferring
                      ? 'Transferring...'
                      : 'Yes, Transfer Ownership'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  )
})
