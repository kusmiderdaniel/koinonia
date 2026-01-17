'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, RefreshCw, Check, AlertTriangle, Calendar, User, Building2 } from 'lucide-react'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
import { useGoogleCalendarConnection } from '@/lib/hooks/useGoogleCalendarConnection'
import { formatDistanceToNow } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

export function GoogleCalendarCard() {
  const t = useTranslations('calendar-integration.google')
  const locale = useLocale()
  const dateLocale = locale === 'pl' ? pl : enUS

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [deleteCalendarsOnDisconnect, setDeleteCalendarsOnDisconnect] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState<number | null>(null)

  const {
    connection,
    calendars,
    availableCampuses,
    canSyncChurchCalendar,
    isLoading,
    connect,
    disconnect,
    updatePreferences,
    triggerSync,
    isConnecting,
    isDisconnecting,
    isUpdatingPreferences,
    isSyncing,
  } = useGoogleCalendarConnection()

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect(deleteCalendarsOnDisconnect)
      setShowDisconnectDialog(false)
      setDeleteCalendarsOnDisconnect(false)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const handleSyncToggle = async (
    type: 'church' | 'personal',
    enabled: boolean
  ) => {
    try {
      if (type === 'church') {
        await updatePreferences({ syncChurchCalendar: enabled })
      } else {
        await updatePreferences({ syncPersonalCalendar: enabled })
      }
    } catch (error) {
      console.error('Failed to update preferences:', error)
    }
  }

  const handleCampusToggle = async (campusId: string, enabled: boolean) => {
    try {
      await updatePreferences({
        campusPreferences: [{ campusId, enabled }],
      })
    } catch (error) {
      console.error('Failed to toggle campus:', error)
    }
  }

  const handleSync = async () => {
    try {
      setSyncSuccess(null)
      const result = await triggerSync()
      // @ts-expect-error - result exists from the fetch
      if (result?.synced !== undefined) {
        // @ts-expect-error - result exists from the fetch
        setSyncSuccess(result.synced)
        setTimeout(() => setSyncSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Failed to sync:', error)
    }
  }

  // Get enabled calendars for display
  const campusCalendars = calendars.filter((c) => c.type === 'campus')

  // Get campuses that are enabled for sync
  const enabledCampusIds = new Set(campusCalendars.map((c) => c.campusId))

  if (isLoading) {
    return (
      <Card className="border border-black dark:border-white !ring-0">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 border border-black dark:border-white rounded-lg p-4">
      {/* Connection Card */}
      <Card className="!border-0 !border-transparent shadow-none !ring-0 ring-transparent">
        <CardHeader className="pb-3 pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{t('title')}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {t('recommended')}
              </Badge>
            </div>
            {connection && !connection.requiresReauth && (
              <Button
                variant="outline"
                size="sm"
                className="!border-black/20 dark:!border-white/20"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : syncSuccess !== null ? (
                  <Check className="h-4 w-4 mr-1.5 text-green-500" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                )}
                {isSyncing
                  ? t('syncing')
                  : syncSuccess !== null
                    ? t('syncSuccess', { count: syncSuccess })
                    : t('sync')}
              </Button>
            )}
          </div>
          <CardDescription>
            {t('description1')}
            <br />
            {t('description2')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!connection ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="rounded-full bg-muted p-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{t('notConnected')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('description1')} {t('description2')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleConnect}
                disabled={isConnecting}
                className="gap-2"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="h-4 w-4" />
                )}
                {t('connect')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {t('connectedAs', { email: connection.googleEmail })}
                  </p>
                  {connection.requiresReauth ? (
                    <div className="flex items-center gap-1 text-amber-600 mt-0.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="text-xs">{t('requiresReauth')}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {connection.lastSyncAt
                        ? t('lastSync', {
                            time: formatDistanceToNow(connection.lastSyncAt, {
                              addSuffix: true,
                              locale: dateLocale,
                            }),
                          })
                        : t('neverSynced')}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={
                  connection.requiresReauth
                    ? handleConnect
                    : () => setShowDisconnectDialog(true)
                }
                disabled={isConnecting || isDisconnecting}
                className="gap-2 !border-black/20 dark:!border-white/20"
              >
                {(isConnecting || isDisconnecting) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : connection.requiresReauth ? (
                  <GoogleIcon className="h-4 w-4" />
                ) : null}
                {connection.requiresReauth ? t('reconnect') : t('disconnect')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendars Card - Only shown when connected */}
      {connection && !connection.requiresReauth && (
        <Card className="!border-0 !border-transparent shadow-none !ring-0 ring-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('calendars.title')}</CardTitle>
            <CardDescription>{t('calendars.description')}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-1">
            {/* Church calendar (admins only) */}
            {canSyncChurchCalendar && (
              <>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor="sync-church" className="text-sm font-medium cursor-pointer">
                        {t('calendars.church')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('calendars.churchDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sync-church"
                    checked={connection.syncChurchCalendar}
                    onCheckedChange={(checked) =>
                      handleSyncToggle('church', checked)
                    }
                    disabled={isUpdatingPreferences}
                  />
                </div>
                <Separator />
              </>
            )}

            {/* Personal calendar */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-muted p-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label htmlFor="sync-personal" className="text-sm font-medium cursor-pointer">
                    {t('calendars.personal')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('calendars.personalDescription')}
                  </p>
                </div>
              </div>
              <Switch
                id="sync-personal"
                checked={connection.syncPersonalCalendar}
                onCheckedChange={(checked) =>
                  handleSyncToggle('personal', checked)
                }
                disabled={isUpdatingPreferences}
              />
            </div>

            {/* Campus calendars */}
            {availableCampuses.length > 0 && (
              <>
                <Separator />
                <div className="py-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-md bg-muted p-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('calendars.campus')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('calendars.campusDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-11">
                    {availableCampuses.map((campus) => (
                      <div
                        key={campus.id}
                        className="flex items-center justify-between py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          {campus.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: campus.color }}
                            />
                          )}
                          <Label
                            htmlFor={`campus-${campus.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {campus.name}
                          </Label>
                        </div>
                        <Switch
                          id={`campus-${campus.id}`}
                          checked={enabledCampusIds.has(campus.id)}
                          onCheckedChange={(checked) =>
                            handleCampusToggle(campus.id, checked === true)
                          }
                          disabled={isUpdatingPreferences}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disconnect Dialog */}
      <AlertDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('disconnectDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('disconnectDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex items-start space-x-2 py-2">
            <Checkbox
              id="delete-calendars"
              checked={deleteCalendarsOnDisconnect}
              onCheckedChange={(checked) =>
                setDeleteCalendarsOnDisconnect(checked === true)
              }
            />
            <div className="grid gap-1 leading-none">
              <Label
                htmlFor="delete-calendars"
                className="text-sm font-medium cursor-pointer"
              >
                {t('disconnectDialog.deleteCalendars')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('disconnectDialog.deleteCalendarsDescription')}
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="!border-0">{t('disconnectDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t('disconnectDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
