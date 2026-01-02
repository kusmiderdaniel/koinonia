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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList
          className={`grid w-full gap-1 h-auto p-1 border border-black dark:border-zinc-700 ${
            settings.isOwner
              ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
              : settings.isAdmin
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
                : settings.canManageLocations
                  ? 'grid-cols-3'
                  : 'grid-cols-2'
          } mb-6`}
        >
          <TabsTrigger value="details" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Details</TabsTrigger>
          <TabsTrigger value="invite" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Invite</TabsTrigger>
          {settings.canManageLocations && <TabsTrigger value="locations" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Locations</TabsTrigger>}
          {settings.isAdmin && <TabsTrigger value="campuses" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Campuses</TabsTrigger>}
          {settings.isAdmin && <TabsTrigger value="presets" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Agenda Items</TabsTrigger>}
          {settings.isAdmin && <TabsTrigger value="preferences" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Preferences</TabsTrigger>}
          {settings.isOwner && <TabsTrigger value="transfer" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-xs sm:text-sm py-2">Transfer</TabsTrigger>}
        </TabsList>

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
          <TabsContent value="campuses">
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
          <TabsContent value="presets">
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
