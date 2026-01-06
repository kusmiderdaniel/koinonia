'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useChurchSettings,
  useLocationManager,
  useCampusManager,
  usePreferencesManager,
  useOwnershipTransfer,
} from './hooks'
import {
  ChurchDetailsTab,
  InviteMembersTab,
  LocationsTab,
  CampusesTab,
  PreferencesTab,
  TransferOwnershipTab,
  AgendaPresetsTab,
} from './components'
import type { ChurchSettingsData, Location, Member } from './types'
import type { Campus } from './actions'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

export interface SettingsInitialData {
  church: ChurchSettingsData
  members: Member[]
  locations: Location[]
  campuses: Campus[]
  presets: Preset[]
  ministries: Ministry[]
}

interface SettingsPageClientProps {
  initialData: SettingsInitialData
  defaultTab?: string
}

export function SettingsPageClient({ initialData, defaultTab = 'details' }: SettingsPageClientProps) {
  const settings = useChurchSettings(initialData)
  const locationManager = useLocationManager()
  const campusManager = useCampusManager()
  const preferencesManager = usePreferencesManager()
  const ownershipTransfer = useOwnershipTransfer(settings.members)
  const [presets, setPresets] = useState<Preset[]>(initialData.presets)
  const presetsMinistries = initialData.ministries
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.church.logo_url)

  // Initialize preferences from loaded settings
  useEffect(() => {
    if (!settings.isLoadingData) {
      preferencesManager.initializePreferences(settings.preferences)
    }
  }, [settings.isLoadingData, settings.preferences]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Church Settings</h1>
            <p className="text-muted-foreground">
              Manage your church details and invite new members
            </p>
          </div>
        </div>

        {settings.error && (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertDescription>{settings.error}</AlertDescription>
          </Alert>
        )}

        {settings.success && (
          <Alert className="mb-4 border-green-500 text-green-700 shrink-0">
            <AlertDescription>{settings.success}</AlertDescription>
          </Alert>
        )}

        {!settings.isAdmin && (
          <Alert className="mb-4 shrink-0">
            <AlertDescription>
              Only church administrators can modify settings. Contact your admin for changes.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0">
          <Tabs defaultValue={defaultTab} className="h-full flex flex-col md:flex-row gap-6" orientation="vertical">
            {/* Left side - Tab navigation */}
            <div className="md:w-56 shrink-0">
              <TabsList className="flex md:flex-col w-full h-auto gap-1 p-1 border border-black dark:border-zinc-700 rounded-lg bg-muted/50">
                <TabsTrigger
                  value="details"
                  className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="invite"
                  className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                >
                  Invite Members
                </TabsTrigger>
                {settings.canManageLocations && (
                  <TabsTrigger
                    value="locations"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    Locations
                  </TabsTrigger>
                )}
                {settings.isAdmin && (
                  <TabsTrigger
                    value="campuses"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    Campuses
                  </TabsTrigger>
                )}
                {settings.isAdmin && (
                  <TabsTrigger
                    value="presets"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    Agenda Items
                  </TabsTrigger>
                )}
                {settings.isAdmin && (
                  <TabsTrigger
                    value="preferences"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    Preferences
                  </TabsTrigger>
                )}
                {settings.isOwner && (
                  <TabsTrigger
                    value="transfer"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    Transfer Ownership
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Right side - Tab content */}
            <div className="flex-1 min-w-0 overflow-auto">
              <div className="border border-black dark:border-zinc-700 rounded-lg p-4 w-fit">
              {/* Church Details Tab */}
              <TabsContent value="details" className="mt-0 h-full">
                <ChurchDetailsTab
                  form={settings.form}
                  isLoading={settings.isLoading}
                  isAdmin={settings.isAdmin}
                  churchData={settings.churchData}
                  logoUrl={logoUrl}
                  onLogoChange={setLogoUrl}
                  onSubmit={settings.onSubmit}
                />
              </TabsContent>

              {/* Invite Members Tab */}
              <TabsContent value="invite" className="mt-0 h-full">
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
                <TabsContent value="locations" className="mt-0 h-full">
                  <LocationsTab
                    locations={settings.locations}
                    campuses={settings.campuses}
                    locationManager={locationManager}
                    setLocations={settings.setLocations}
                    setError={settings.setError}
                    setSuccess={settings.setSuccess}
                  />
                </TabsContent>
              )}

              {/* Campuses Tab */}
              {settings.isAdmin && (
                <TabsContent value="campuses" className="mt-0 h-full">
                  <CampusesTab
                    campuses={settings.campuses}
                    campusManager={campusManager}
                    setCampuses={settings.setCampuses}
                    setError={settings.setError}
                    setSuccess={settings.setSuccess}
                  />
                </TabsContent>
              )}

              {/* Agenda Presets Tab */}
              {settings.isAdmin && (
                <TabsContent value="presets" className="mt-0 h-full">
                  <AgendaPresetsTab
                    presets={presets}
                    ministries={presetsMinistries}
                    setPresets={setPresets}
                    setError={settings.setError}
                    setSuccess={settings.setSuccess}
                  />
                </TabsContent>
              )}

              {/* Preferences Tab */}
              {settings.isAdmin && (
                <TabsContent value="preferences" className="mt-0 h-full">
                  <PreferencesTab
                    preferencesManager={preferencesManager}
                    setError={settings.setError}
                    setSuccess={settings.setSuccess}
                  />
                </TabsContent>
              )}

              {/* Transfer Ownership Tab */}
              {settings.isOwner && (
                <TabsContent value="transfer" className="mt-0 h-full">
                  <TransferOwnershipTab
                    ownershipTransfer={ownershipTransfer}
                    setError={settings.setError}
                    setSuccess={settings.setSuccess}
                  />
                </TabsContent>
              )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
