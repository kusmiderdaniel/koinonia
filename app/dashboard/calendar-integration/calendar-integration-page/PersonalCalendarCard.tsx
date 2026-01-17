'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('calendar-integration')

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{t('personal.title')}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t('personal.description')}
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
              title={t('personal.copyUrl')}
              className="!border-black/20 dark:!border-white/20"
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
              className="gap-2 !border-black/20 dark:!border-white/20"
            >
              <ExternalLink className="h-4 w-4" />
              {t('personal.addToCalendar')}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 text-muted-foreground !border-black/20 dark:!border-white/20"
                  disabled={isRegenerating}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
                  />
                  {t('personal.regenerateLink')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('regenerate.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('regenerate.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="!border-0">{t('regenerate.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onRegenerate}
                    className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
                  >
                    {t('regenerate.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('personal.privateWarning')}
          </p>
        </div>
      )}
    </div>
  )
}
