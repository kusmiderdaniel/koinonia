'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function HelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How it works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          <strong>Subscription calendars</strong> automatically sync with your
          calendar app. When events are added or updated in Koinonia,
          they&apos;ll appear in your calendar within 24 hours.
        </p>
        <p>
          <strong>Google Calendar:</strong> Click &quot;Add to Calendar&quot; or
          go to Settings → Add calendar → From URL and paste the link.
        </p>
        <p>
          <strong>Apple Calendar:</strong> Click &quot;Add to Calendar&quot; or
          go to File → New Calendar Subscription and paste the link.
        </p>
        <p>
          <strong>Note:</strong> These calendars are read-only. Changes made in
          your calendar app won&apos;t sync back to Koinonia.
        </p>
      </CardContent>
    </Card>
  )
}
