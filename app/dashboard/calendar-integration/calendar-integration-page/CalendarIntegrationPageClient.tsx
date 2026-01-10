'use client'

import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/LoadingState'
import { useCalendarIntegrationState } from './useCalendarIntegrationState'
import { PersonalCalendarCard } from './PersonalCalendarCard'
import { PublicCalendarsCard } from './PublicCalendarsCard'
import { HelpCard } from './HelpCard'

export function CalendarIntegrationPageClient() {
  const t = useTranslations('calendar-integration')
  const {
    campuses,
    isLoading,
    isRegenerating,
    error,
    copiedPersonal,
    copiedCampusId,
    personalCalendarUrl,
    personalWebcalUrl,
    getPublicCalendarUrl,
    getPublicWebcalUrl,
    handleRegenerate,
    copyToClipboard,
  } = useCalendarIntegrationState()

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] md:h-screen items-center justify-center">
        <LoadingState message={t('loading')} />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="border border-black dark:border-zinc-700 rounded-lg px-3 md:px-4 py-4 md:py-6 w-fit">
            <PersonalCalendarCard
              calendarUrl={personalCalendarUrl}
              webcalUrl={personalWebcalUrl}
              copied={copiedPersonal}
              isRegenerating={isRegenerating}
              onCopy={() =>
                personalCalendarUrl &&
                copyToClipboard(personalCalendarUrl, 'personal')
              }
              onRegenerate={handleRegenerate}
            />

            {campuses.length > 0 && (
              <>
                <div className="border-t border-black dark:border-zinc-700 my-6" />
                <PublicCalendarsCard
                  campuses={campuses}
                  copiedCampusId={copiedCampusId}
                  getPublicCalendarUrl={getPublicCalendarUrl}
                  getPublicWebcalUrl={getPublicWebcalUrl}
                  onCopy={copyToClipboard}
                />
              </>
            )}

            <div className="border-t border-black dark:border-zinc-700 my-6" />
            <HelpCard />
          </div>
        </div>
      </div>
    </div>
  )
}
