'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type NotificationPreferences,
  REMINDER_DAYS_OPTIONS,
} from '@/types/notification-preferences'

interface NotificationSettingsCardProps {
  preferences: NotificationPreferences
  isLoading: boolean
  onPreferencesChange: (preferences: NotificationPreferences) => void
  onSave: () => void
}

interface NotificationRowProps {
  id: string
  label: string
  description: string
  inApp: boolean
  email: boolean
  disabled: boolean
  inAppLabel: string
  emailLabel: string
  onInAppChange: (value: boolean) => void
  onEmailChange: (value: boolean) => void
  children?: React.ReactNode
}

function NotificationRow({
  id,
  label,
  description,
  inApp,
  email,
  disabled,
  inAppLabel,
  emailLabel,
  onInAppChange,
  onEmailChange,
  children,
}: NotificationRowProps) {
  return (
    <div className="space-y-3 py-4 border-b border-black/20 dark:border-white/20 last:border-b-0">
      <div>
        <Label htmlFor={`${id}-in-app`} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-in-app`}
            checked={inApp}
            onCheckedChange={onInAppChange}
            disabled={disabled}
          />
          <Label
            htmlFor={`${id}-in-app`}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            {inAppLabel}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-email`}
            checked={email}
            onCheckedChange={onEmailChange}
            disabled={disabled}
          />
          <Label
            htmlFor={`${id}-email`}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            {emailLabel}
          </Label>
        </div>
        {children}
      </div>
    </div>
  )
}

export function NotificationSettingsCard({
  preferences,
  isLoading,
  onPreferencesChange,
  onSave,
}: NotificationSettingsCardProps) {
  const t = useTranslations('profile.notifications')
  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    field: keyof NotificationPreferences[K],
    value: boolean | number
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: {
        ...preferences[key],
        [field]: value,
      },
    })
  }

  return (
    <Card className="border-0 shadow-none !ring-0">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Ministry Invitation Section */}
        <div className="pb-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.ministryInvitations')}
          </h4>
          <p className="text-xs text-muted-foreground">
            {t('sections.ministryInvitationsDescription')}
          </p>
        </div>

        <NotificationRow
          id="ministry-accepted"
          label={t('categories.invitationAccepted')}
          description={t('categories.invitationAcceptedDescription')}
          inApp={preferences.ministry_invitation_accepted.in_app}
          email={preferences.ministry_invitation_accepted.email}
          disabled={isLoading}
          inAppLabel={t('inApp')}
          emailLabel={t('email')}
          onInAppChange={(value) =>
            updatePreference('ministry_invitation_accepted', 'in_app', value)
          }
          onEmailChange={(value) =>
            updatePreference('ministry_invitation_accepted', 'email', value)
          }
        />

        <NotificationRow
          id="ministry-declined"
          label={t('categories.invitationDeclined')}
          description={t('categories.invitationDeclinedDescription')}
          inApp={preferences.ministry_invitation_declined.in_app}
          email={preferences.ministry_invitation_declined.email}
          disabled={isLoading}
          inAppLabel={t('inApp')}
          emailLabel={t('email')}
          onInAppChange={(value) =>
            updatePreference('ministry_invitation_declined', 'in_app', value)
          }
          onEmailChange={(value) =>
            updatePreference('ministry_invitation_declined', 'email', value)
          }
        />

        {/* Event Invitation Section */}
        <div className="pb-2 pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.eventInvitations')}
          </h4>
          <p className="text-xs text-muted-foreground">
            {t('sections.eventInvitationsDescription')}
          </p>
        </div>

        <NotificationRow
          id="event-accepted"
          label={t('categories.invitationAccepted')}
          description={t('categories.invitationAcceptedDescription')}
          inApp={preferences.event_invitation_accepted.in_app}
          email={preferences.event_invitation_accepted.email}
          disabled={isLoading}
          inAppLabel={t('inApp')}
          emailLabel={t('email')}
          onInAppChange={(value) =>
            updatePreference('event_invitation_accepted', 'in_app', value)
          }
          onEmailChange={(value) =>
            updatePreference('event_invitation_accepted', 'email', value)
          }
        />

        <NotificationRow
          id="event-declined"
          label={t('categories.invitationDeclined')}
          description={t('categories.invitationDeclinedDescription')}
          inApp={preferences.event_invitation_declined.in_app}
          email={preferences.event_invitation_declined.email}
          disabled={isLoading}
          inAppLabel={t('inApp')}
          emailLabel={t('email')}
          onInAppChange={(value) =>
            updatePreference('event_invitation_declined', 'in_app', value)
          }
          onEmailChange={(value) =>
            updatePreference('event_invitation_declined', 'email', value)
          }
        />

        {/* Reminders Section */}
        <div className="pb-2 pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.reminders')}
          </h4>
        </div>

        <NotificationRow
          id="unfilled-reminder"
          label={t('categories.unfilledPositionsReminder')}
          description={t('categories.unfilledPositionsReminderDescription')}
          inApp={preferences.unfilled_positions_reminder.in_app}
          email={preferences.unfilled_positions_reminder.email}
          disabled={isLoading}
          inAppLabel={t('inApp')}
          emailLabel={t('email')}
          onInAppChange={(value) =>
            updatePreference('unfilled_positions_reminder', 'in_app', value)
          }
          onEmailChange={(value) =>
            updatePreference('unfilled_positions_reminder', 'email', value)
          }
        >
          <div className="flex items-center gap-2">
            <Select
              value={preferences.unfilled_positions_reminder.days_before.toString()}
              onValueChange={(value) =>
                updatePreference(
                  'unfilled_positions_reminder',
                  'days_before',
                  parseInt(value)
                )
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-24 h-8 text-sm bg-white dark:bg-zinc-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-950">
                {REMINDER_DAYS_OPTIONS.map((days) => (
                  <SelectItem key={days} value={days.toString()}>
                    {days} {days === 1 ? t('reminderDays.day') : t('reminderDays.days')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{t('reminderDays.beforeEvent')}</span>
          </div>
        </NotificationRow>

        {/* Other Section */}
        <div className="pb-2 pt-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('sections.other')}
          </h4>
        </div>

        <NotificationRow
          id="pending-members"
          label={t('categories.pendingMembers')}
          description={t('categories.pendingMembersDescription')}
          inApp={preferences.pending_member_registrations.in_app}
          email={preferences.pending_member_registrations.email}
          disabled={isLoading}
          inAppLabel={t('inApp')}
          emailLabel={t('email')}
          onInAppChange={(value) =>
            updatePreference('pending_member_registrations', 'in_app', value)
          }
          onEmailChange={(value) =>
            updatePreference('pending_member_registrations', 'email', value)
          }
        />

        <div className="flex justify-end pt-6">
          <Button
            type="button"
            disabled={isLoading}
            onClick={onSave}
            className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
          >
            {isLoading ? t('saving') : t('saveSettings')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
