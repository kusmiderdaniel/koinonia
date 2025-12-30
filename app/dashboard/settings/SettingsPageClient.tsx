'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useChurchSettings,
  useLocationManager,
  usePreferencesManager,
  useOwnershipTransfer,
} from './hooks'
import {
  ChurchDetailsTab,
  InviteMembersTab,
  LocationsTab,
  PreferencesTab,
  TransferOwnershipTab,
} from './components'
import type { ChurchSettingsData, Location, Member } from './types'

export interface SettingsInitialData {
  church: ChurchSettingsData
  members: Member[]
  locations: Location[]
}

interface SettingsPageClientProps {
  initialData: SettingsInitialData
}

export function SettingsPageClient({ initialData }: SettingsPageClientProps) {
  const settings = useChurchSettings(initialData)
  const locationManager = useLocationManager()
  const preferencesManager = usePreferencesManager()
  const ownershipTransfer = useOwnershipTransfer(settings.members)

  // Initialize preferences from loaded settings
  useEffect(() => {
    if (!settings.isLoadingData) {
      preferencesManager.initializePreferences(settings.preferences)
    }
  }, [settings.isLoadingData, settings.preferences]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold">Church Settings</h1>
        <p className="text-muted-foreground">
          Manage your church details and invite new members
        </p>
      </div>

      {settings.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{settings.error}</AlertDescription>
        </Alert>
      )}

      {settings.success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <AlertDescription>{settings.success}</AlertDescription>
        </Alert>
      )}

      {!settings.isAdmin && (
        <Alert className="mb-6">
          <AlertDescription>
            Only church administrators can modify settings. Contact your admin for changes.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="details" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-6">
          <TabsList
            className={`inline-flex md:grid w-auto md:w-full border border-black dark:border-zinc-700 ${
              settings.isOwner
                ? 'md:grid-cols-5'
                : settings.canManageLocations && settings.isAdmin
                  ? 'md:grid-cols-4'
                  : settings.canManageLocations
                    ? 'md:grid-cols-3'
                    : settings.isAdmin
                      ? 'md:grid-cols-3'
                      : 'md:grid-cols-2'
            }`}
          >
            <TabsTrigger value="details" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground whitespace-nowrap">Church Details</TabsTrigger>
            <TabsTrigger value="invite" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground whitespace-nowrap">Invite</TabsTrigger>
            {settings.canManageLocations && <TabsTrigger value="locations" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground whitespace-nowrap">Locations</TabsTrigger>}
            {settings.isAdmin && <TabsTrigger value="preferences" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground whitespace-nowrap">Preferences</TabsTrigger>}
            {settings.isOwner && <TabsTrigger value="transfer" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground whitespace-nowrap">Transfer</TabsTrigger>}
          </TabsList>
        </div>

        {/* Church Details Tab */}
        <TabsContent value="details">
          <ChurchDetailsTab
            form={settings.form}
            isLoading={settings.isLoading}
            isAdmin={settings.isAdmin}
            churchData={settings.churchData}
            onSubmit={settings.onSubmit}
          />
        </TabsContent>

        {/* Invite Members Tab */}
        <TabsContent value="invite">
          <InviteMembersTab
            joinCode={settings.churchData?.join_code}
            joinCodeCopied={settings.joinCodeCopied}
            isRegeneratingCode={settings.isRegeneratingCode}
            isAdmin={settings.isAdmin}
            onCopyJoinCode={settings.copyJoinCode}
            onRegenerateJoinCode={settings.handleRegenerateJoinCode}
          />
        </TabsContent>

        {/* Locations Tab */}
        {settings.canManageLocations && (
          <TabsContent value="locations">
            <LocationsTab
              locations={settings.locations}
              locationManager={locationManager}
              setLocations={settings.setLocations}
              setError={settings.setError}
              setSuccess={settings.setSuccess}
            />
          </TabsContent>
        )}

        {/* Preferences Tab */}
        {settings.isAdmin && (
          <TabsContent value="preferences">
            <PreferencesTab
              preferencesManager={preferencesManager}
              setError={settings.setError}
              setSuccess={settings.setSuccess}
            />
          </TabsContent>
        )}

        {/* Transfer Ownership Tab */}
        {settings.isOwner && (
          <TabsContent value="transfer">
            <TransferOwnershipTab
              ownershipTransfer={ownershipTransfer}
              setError={settings.setError}
              setSuccess={settings.setSuccess}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
