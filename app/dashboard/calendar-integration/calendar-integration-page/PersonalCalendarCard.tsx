'use client'

import { Copy, Check, RefreshCw, ExternalLink, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          My Calendar
        </CardTitle>
        <CardDescription>
          Events where you have assignments (invited or accepted) and hidden
          events you&apos;re invited to. Your role in each event is shown in the
          description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {calendarUrl && (
          <>
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
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Add to Calendar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
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
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
