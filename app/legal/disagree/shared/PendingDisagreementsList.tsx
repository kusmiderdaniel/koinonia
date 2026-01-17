'use client'

import { Calendar, Clock, ExternalLink, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatShortDate, formatRelativeTime, getDocumentUrl } from './utils'
import type { PendingDisagreement } from './types'

interface PendingDisagreementsListProps {
  disagreements: PendingDisagreement[]
  language: 'en' | 'pl'
  isSubmitting: boolean
  getDocumentTypeName: (type: string) => string
  onWithdraw: (disagreementId: string) => void
  translations: {
    deadline: string
    reAgree: string
    viewDocument: string
  }
}

export function PendingDisagreementsList({
  disagreements,
  language,
  isSubmitting,
  getDocumentTypeName,
  onWithdraw,
  translations: t,
}: PendingDisagreementsListProps) {
  return (
    <div className="space-y-4">
      {disagreements.map((d) => {
        const formattedTitle = getDocumentTypeName(d.documentType)
        const documentUrl = getDocumentUrl(d.documentType)

        return (
          <div
            key={d.id}
            className="p-4 border rounded-lg bg-muted/30 space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-base">{formattedTitle}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t.deadline}: {formatShortDate(d.deadline, language)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                  <Clock className="h-4 w-4" />
                  <span>{formatRelativeTime(d.deadline, language)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(documentUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t.viewDocument}
              </Button>
              <Button
                size="sm"
                onClick={() => onWithdraw(d.id)}
                disabled={isSubmitting}
                className="!bg-green-600 hover:!bg-green-700 !text-brand-foreground"
              >
                <Check className="mr-2 h-4 w-4" />
                {t.reAgree}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
