'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'

export interface PendingDisagreement {
  id: string
  documentType: string
  documentTitle: string
  deadline: string
  isChurchDeletion: boolean
}

interface PendingDisagreementBannerProps {
  disagreements: PendingDisagreement[]
  language: 'en' | 'pl'
}

const translations = {
  en: {
    accountMessage: 'Your account will be deleted',
    churchMessage: 'Your church will be deleted',
    withdrawButton: 'Withdraw & Re-agree',
  },
  pl: {
    accountMessage: 'Twoje konto zostanie usunięte',
    churchMessage: 'Twój kościół zostanie usunięty',
    withdrawButton: 'Wycofaj i zaakceptuj',
  },
}

export function PendingDisagreementBanner({
  disagreements,
  language,
}: PendingDisagreementBannerProps) {
  if (!disagreements || disagreements.length === 0) {
    return null
  }

  const t = translations[language]
  const dateFnsLocale = language === 'pl' ? pl : enUS
  const firstDisagreement = disagreements[0]
  const isChurchDeletion = firstDisagreement.isChurchDeletion
  const deadline = new Date(firstDisagreement.deadline)
  const timeRemaining = formatDistanceToNow(deadline, {
    addSuffix: true,
    locale: dateFnsLocale
  })

  // Route to the appropriate page based on whether it's a church or user document
  const withdrawUrl = isChurchDeletion ? '/legal/disagree/church' : '/legal/disagree/user'

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/30">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-400">
          <span className="font-medium">
            {isChurchDeletion ? t.churchMessage : t.accountMessage}
          </span>
          {' '}
          <span className="text-red-600 dark:text-red-500">{timeRemaining}</span>
        </p>
      </div>
      <Link href={withdrawUrl}>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 !text-brand-foreground font-medium h-8"
        >
          {t.withdrawButton}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  )
}
