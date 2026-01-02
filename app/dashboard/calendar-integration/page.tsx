'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { LoadingState } from '@/components/LoadingState'
import {
  getOrCreateCalendarToken,
  regenerateCalendarToken,
  getChurchCampuses,
} from './actions'

interface Campus {
  id: string
  name: string
  color: string | null
}

export default function CalendarIntegrationPage() {
  const [token, setToken] = useState<string | null>(null)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [churchSubdomain, setChurchSubdomain] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedPersonal, setCopiedPersonal] = useState(false)
  const [copiedCampusId, setCopiedCampusId] = useState<string | null>(null)

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://koinonia.vercel.app'

  const personalCalendarUrl = token
    ? `${baseUrl}/api/calendar/personal/${token}`
    : null

  const personalWebcalUrl = token
    ? `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/personal/${token}`
    : null

  const getPublicCalendarUrl = (campusId: string) =>
    `${baseUrl}/api/calendar/public/${churchSubdomain}/${campusId}`

  const getPublicWebcalUrl = (campusId: string) =>
    `webcal://${baseUrl.replace(/^https?:\/\//, '')}/api/calendar/public/${churchSubdomain}/${campusId}`

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      // Load token
      const tokenResult = await getOrCreateCalendarToken()
      if (tokenResult.error) {
        setError(tokenResult.error)
      } else if (tokenResult.data) {
        setToken(tokenResult.data.token)
      }

      // Load campuses
      const campusResult = await getChurchCampuses()
      if (campusResult.data) {
        setCampuses(campusResult.data)
        setChurchSubdomain(campusResult.churchSubdomain || '')
      }

      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)

    const result = await regenerateCalendarToken()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setToken(result.data.token)
    }

    setIsRegenerating(false)
  }

  const copyToClipboard = async (text: string, type: 'personal' | string) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'personal') {
        setCopiedPersonal(true)
        setTimeout(() => setCopiedPersonal(false), 2000)
      } else {
        setCopiedCampusId(type)
        setTimeout(() => setCopiedCampusId(null), 2000)
      }
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      if (type === 'personal') {
        setCopiedPersonal(true)
        setTimeout(() => setCopiedPersonal(false), 2000)
      } else {
        setCopiedCampusId(type)
        setTimeout(() => setCopiedCampusId(null), 2000)
      }
    }
  }

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
        {/* Personal Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              My Calendar
            </CardTitle>
            <CardDescription>
              Events where you have assignments (invited or accepted) and hidden
              events you&apos;re invited to. Your role in each event is shown in
              the description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalCalendarUrl && (
              <>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={personalCalendarUrl}
                    className="font-mono text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(personalCalendarUrl, 'personal')
                    }
                    title="Copy URL"
                  >
                    {copiedPersonal ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(personalWebcalUrl!, '_blank')}
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
                          onClick={handleRegenerate}
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

        {/* Public Campus Calendars */}
        {campuses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Public Campus Calendars</CardTitle>
              <CardDescription>
                Subscribe to see all public events for a campus. Anyone can
                subscribe to these calendars.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campuses.map((campus) => (
                <div
                  key={campus.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {campus.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: campus.color }}
                      />
                    )}
                    <span className="font-medium truncate">{campus.name}</span>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          getPublicCalendarUrl(campus.id),
                          campus.id
                        )
                      }
                      className="gap-1"
                    >
                      {copiedCampusId === campus.id ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(getPublicWebcalUrl(campus.id), '_blank')
                      }
                      className="gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Subscription calendars</strong> automatically sync with
              your calendar app. When events are added or updated in Koinonia,
              they&apos;ll appear in your calendar within 24 hours.
            </p>
            <p>
              <strong>Google Calendar:</strong> Click &quot;Add to Calendar&quot; or go to
              Settings → Add calendar → From URL and paste the link.
            </p>
            <p>
              <strong>Apple Calendar:</strong> Click &quot;Add to Calendar&quot; or go to
              File → New Calendar Subscription and paste the link.
            </p>
            <p>
              <strong>Note:</strong> These calendars are read-only. Changes made
              in your calendar app won&apos;t sync back to Koinonia.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
