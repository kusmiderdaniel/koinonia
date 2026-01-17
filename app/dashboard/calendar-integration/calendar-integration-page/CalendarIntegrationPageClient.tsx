'use client'

import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/LoadingState'
import { useCalendarIntegrationState } from './useCalendarIntegrationState'
import { PersonalCalendarCard } from './PersonalCalendarCard'
import { PublicCalendarsCard } from './PublicCalendarsCard'
import { HelpCard } from './HelpCard'
import { GoogleCalendarCard } from '../components/GoogleCalendarCard'

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
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="mb-4 border bg-transparent p-1">
              <TabsTrigger
                value="google"
                className="data-[state=active]:bg-brand data-[state=active]:!text-brand-foreground"
              >
                {t('tabs.google')}
              </TabsTrigger>
              <TabsTrigger
                value="other"
                className="data-[state=active]:bg-brand data-[state=active]:!text-brand-foreground"
              >
                {t('tabs.other')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="mt-0">
              <div className="space-y-6">
                <GoogleCalendarCard />
              </div>
            </TabsContent>

            <TabsContent value="other" className="mt-0">
              <div className="space-y-6 border border-black dark:border-white rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">{t('ics.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('ics.description')}
                  </p>
                </div>

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
                    <div className="border-t border-black/20 dark:border-white/20" />
                    <PublicCalendarsCard
                      campuses={campuses}
                      copiedCampusId={copiedCampusId}
                      getPublicCalendarUrl={getPublicCalendarUrl}
                      getPublicWebcalUrl={getPublicWebcalUrl}
                      onCopy={copyToClipboard}
                    />
                  </>
                )}

                <div className="border-t border-black/20 dark:border-white/20" />
                <HelpCard />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
