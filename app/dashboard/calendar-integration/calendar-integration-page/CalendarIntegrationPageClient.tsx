'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/LoadingState'
import { useCalendarIntegrationState } from './useCalendarIntegrationState'
import { PersonalCalendarCard } from './PersonalCalendarCard'
import { PublicCalendarsCard } from './PublicCalendarsCard'
import { HelpCard } from './HelpCard'

export function CalendarIntegrationPageClient() {
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
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <LoadingState message="Loading calendar settings..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Calendar Integration</h1>
        <p className="text-muted-foreground">
          Subscribe to church calendars in Google Calendar, Apple Calendar, or
          any other calendar app
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
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

        <PublicCalendarsCard
          campuses={campuses}
          copiedCampusId={copiedCampusId}
          getPublicCalendarUrl={getPublicCalendarUrl}
          getPublicWebcalUrl={getPublicWebcalUrl}
          onCopy={copyToClipboard}
        />

        <HelpCard />
      </div>
    </div>
  )
}
