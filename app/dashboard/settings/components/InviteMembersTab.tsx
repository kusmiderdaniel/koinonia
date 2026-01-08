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
    <Card className="w-full md:min-w-[28rem]">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl">Invite Members</CardTitle>
        <CardDescription className="text-sm">
          Share the join code to invite people to your church
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        <div className="border border-black dark:border-zinc-700 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
          <div className="text-sm font-medium">Church Join Code</div>

          {/* Join code display */}
          <div className="flex items-center justify-center py-3 md:py-4 bg-muted rounded-lg border border-black dark:border-white">
            <span className="text-xl md:text-3xl font-mono font-bold tracking-[0.15em] md:tracking-[0.3em] text-foreground">
              {joinCode || '------'}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onCopyJoinCode}
              variant="outline-pill"
              size="sm"
              className="flex-1 !border-black dark:!border-white text-xs md:text-sm"
            >
              <Copy className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              {joinCodeCopied ? 'Copied!' : 'Copy'}
            </Button>
            {isAdmin && (
              <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline-pill"
                    size="sm"
                    disabled={isRegeneratingCode}
                    className="flex-1 !border-black dark:!border-white text-xs md:text-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                    {isRegeneratingCode ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate Join Code?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a new code and invalidate the current one.
                      Anyone with the old code won&apos;t be able to join.
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

          <p className="text-xs md:text-sm text-muted-foreground">
            Share this code with new members to connect them to your church.
          </p>
        </div>
      </CardContent>
    </Card>
  )
})
