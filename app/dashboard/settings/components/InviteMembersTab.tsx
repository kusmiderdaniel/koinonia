'use client'

import { memo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, RefreshCw } from 'lucide-react'
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

interface InviteMembersTabProps {
  joinCode: string | undefined
  joinCodeCopied: boolean
  isRegeneratingCode: boolean
  isAdmin: boolean
  onCopyJoinCode: () => Promise<void>
  onRegenerateJoinCode: () => Promise<void>
}

export const InviteMembersTab = memo(function InviteMembersTab({
  joinCode,
  joinCodeCopied,
  isRegeneratingCode,
  isAdmin,
  onCopyJoinCode,
  onRegenerateJoinCode,
}: InviteMembersTabProps) {
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  const handleRegenerate = async () => {
    await onRegenerateJoinCode()
    setShowRegenerateConfirm(false)
  }

  return (
    <Card className="min-w-[28rem]">
      <CardHeader>
        <CardTitle>Invite Members</CardTitle>
        <CardDescription>
          Share the join code with people to invite them to your church
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border border-black dark:border-zinc-700 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium">Church Join Code</div>

          {/* Join code display */}
          <div className="flex items-center justify-center py-4 bg-muted rounded-lg border border-black dark:border-white">
            <span className="text-2xl md:text-3xl font-mono font-bold tracking-[0.2em] md:tracking-[0.3em] text-foreground">
              {joinCode || '------'}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onCopyJoinCode}
              variant="outline-pill"
              size="sm"
              className="flex-1 sm:flex-none !border-black dark:!border-white"
            >
              <Copy className="h-4 w-4 mr-2" />
              {joinCodeCopied ? 'Copied!' : 'Copy Code'}
            </Button>
            {isAdmin && (
              <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline-pill"
                    size="sm"
                    disabled={isRegeneratingCode}
                    className="flex-1 sm:flex-none !border-black dark:!border-white"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                    {isRegeneratingCode ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate Join Code?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a new join code and immediately invalidate the current one.
                      Anyone with the old code will no longer be able to join.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full border-black dark:border-zinc-700">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRegenerate}
                      className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white"
                    >
                      Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Share this 6-character code with new members. They can enter it when joining to connect to your church.
          </p>
        </div>
      </CardContent>
    </Card>
  )
})
