'use client'

import Link from 'next/link'
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

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
    title: 'Pending Disagreement',
    titlePlural: 'Pending Disagreements',
    accountDeletion: 'Your account is scheduled for deletion',
    churchDeletion: 'Your church is scheduled for deletion',
    deadline: 'Deadline',
    in: 'in',
    withdrawButton: 'Withdraw & Re-agree',
    viewAll: 'View all',
    description: 'You can withdraw your disagreement and keep your account by accepting the updated document.',
    descriptionChurch: 'You can withdraw your disagreement and keep your church by accepting the updated document.',
  },
  pl: {
    title: 'Oczekujący sprzeciw',
    titlePlural: 'Oczekujące sprzeciwy',
    accountDeletion: 'Twoje konto jest zaplanowane do usunięcia',
    churchDeletion: 'Twój kościół jest zaplanowany do usunięcia',
    deadline: 'Termin',
    in: 'za',
    withdrawButton: 'Wycofaj i zaakceptuj',
    viewAll: 'Zobacz wszystkie',
    description: 'Możesz wycofać swój sprzeciw i zachować konto, akceptując zaktualizowany dokument.',
    descriptionChurch: 'Możesz wycofać swój sprzeciw i zachować swój kościół, akceptując zaktualizowany dokument.',
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
  const hasMultiple = disagreements.length > 1
  const firstDisagreement = disagreements[0]
  const isChurchDeletion = firstDisagreement.isChurchDeletion
  const deadline = new Date(firstDisagreement.deadline)
  const timeRemaining = formatDistanceToNow(deadline, { addSuffix: false })

  // Route to the appropriate page based on whether it's a church or user document
  const withdrawUrl = isChurchDeletion ? '/legal/disagree/church' : '/legal/disagree/user'

  return (
    <Alert variant="destructive" className="mb-6 border-red-500 bg-red-50 dark:bg-red-950/30">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-base font-semibold">
        {hasMultiple ? t.titlePlural : t.title}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {isChurchDeletion ? t.churchDeletion : t.accountDeletion}
          </p>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              {t.deadline}: {t.in} {timeRemaining}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {isChurchDeletion ? t.descriptionChurch : t.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-1">
            <Link href={withdrawUrl}>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                {t.withdrawButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            {hasMultiple && (
              <Link href={withdrawUrl}>
                <Button variant="outline" size="sm">
                  {t.viewAll} ({disagreements.length})
                </Button>
              </Link>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
