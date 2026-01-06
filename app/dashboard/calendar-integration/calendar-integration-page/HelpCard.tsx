'use client'

import { HelpCircle } from 'lucide-react'

export function HelpCard() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">How It Works</h2>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Subscription calendars</strong> automatically sync with your
          calendar app. When events are added or updated in Koinonia,
          they&apos;ll appear in your calendar within 24 hours.
        </p>
        <p>
          <strong className="text-foreground">Google Calendar:</strong> Click &quot;Add to Calendar&quot; or
          go to Settings → Add calendar → From URL and paste the link.
        </p>
        <p>
          <strong className="text-foreground">Apple Calendar:</strong> Click &quot;Add to Calendar&quot; or
          go to File → New Calendar Subscription and paste the link.
        </p>
        <p>
          <strong className="text-foreground">Note:</strong> These calendars are read-only. Changes made in
          your calendar app won&apos;t sync back to Koinonia.
        </p>
      </div>
    </div>
  )
}
