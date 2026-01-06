'use client'

import { Copy, Check, RefreshCw, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface PersonalCalendarCardProps {
  calendarUrl: string | null
  webcalUrl: string | null
  copied: boolean
  isRegenerating: boolean
  onCopy: () => void
  onRegenerate: () => void
}

export function PersonalCalendarCard({
  calendarUrl,
  webcalUrl,
  copied,
  isRegenerating,
  onCopy,
  onRegenerate,
}: PersonalCalendarCardProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-5 w-5" />
        <h2 className="text-lg font-semibold">My Calendar</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Events where you have assignments (invited or accepted) and hidden
        events you&apos;re invited to. Your role in each event is shown in the
        description.
      </p>

      {calendarUrl && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={calendarUrl}
              className="font-mono text-sm bg-muted"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={onCopy}
              title="Copy URL"
              className="!border !border-black dark:!border-white"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(webcalUrl!, '_blank')}
              className="gap-2 !border !border-black dark:!border-white"
            >
              <ExternalLink className="h-4 w-4" />
              Add to Calendar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-muted-foreground !border !border-black dark:!border-white"
                  disabled={isRegenerating}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
                  />
                  Regenerate Link
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Regenerate Calendar Link?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will invalidate your current calendar subscription
                    link. Any calendar apps using the old link will stop
                    receiving updates. You&apos;ll need to re-subscribe with
                    the new link.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="!border !border-black dark:!border-white">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRegenerate}
                    className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
                  >
                    Regenerate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground">
            Keep this link private. Anyone with this link can see your
            assigned events.
          </p>
        </div>
      )}
    </div>
  )
}
