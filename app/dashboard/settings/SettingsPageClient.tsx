'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks'
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

type TabKey = 'details' | 'invite' | 'locations' | 'campuses' | 'presets' | 'preferences' | 'transfer'

interface TabItem {
  key: TabKey
  labelKey: string
  descriptionKey: string
  show: boolean
}

export function SettingsPageClient({ initialData, defaultTab = 'details' }: SettingsPageClientProps) {
  const t = useTranslations('settings')
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const settings = useChurchSettings(initialData, {
    savedSuccess: t('details.savedSuccess'),
    regeneratedSuccess: t('invite.regeneratedSuccess'),
  })
  const locationManager = useLocationManager({
    createdSuccess: t('locations.createdSuccess'),
    updatedSuccess: t('locations.updatedSuccess'),
    deletedSuccess: t('locations.deletedSuccess'),
  })
  const campusManager = useCampusManager({
    createdSuccess: t('campuses.createdSuccess'),
    updatedSuccess: t('campuses.updatedSuccess'),
    deletedSuccess: t('campuses.deletedSuccess'),
    defaultUpdatedSuccess: t('campuses.defaultUpdatedSuccess'),
  })
  const preferencesManager = usePreferencesManager({
    savedSuccess: t('preferences.savedSuccess'),
  })
  const ownershipTransfer = useOwnershipTransfer(settings.members, {
    transferredSuccess: t('transfer.transferredSuccess'),
  })
  const [presets, setPresets] = useState<Preset[]>(initialData.presets)
  const presetsMinistries = initialData.ministries
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData.church.logo_url)

  // Mobile navigation state
  const [mobileSelectedTab, setMobileSelectedTab] = useState<TabKey | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize preferences from loaded settings
  useEffect(() => {
    if (!settings.isLoadingData) {
      preferencesManager.initializePreferences(settings.preferences)
    }
  }, [settings.isLoadingData, settings.preferences]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tab items configuration
  const tabItems: TabItem[] = [
    { key: 'details', labelKey: 'tabs.details', descriptionKey: 'tabDescriptions.details', show: true },
    { key: 'invite', labelKey: 'tabs.invite', descriptionKey: 'tabDescriptions.invite', show: true },
    { key: 'locations', labelKey: 'tabs.locations', descriptionKey: 'tabDescriptions.locations', show: settings.canManageLocations },
    { key: 'campuses', labelKey: 'tabs.campuses', descriptionKey: 'tabDescriptions.campuses', show: settings.isAdmin },
    { key: 'presets', labelKey: 'tabs.presets', descriptionKey: 'tabDescriptions.presets', show: settings.isAdmin },
    { key: 'preferences', labelKey: 'tabs.preferences', descriptionKey: 'tabDescriptions.preferences', show: settings.isAdmin },
    { key: 'transfer', labelKey: 'tabs.transfer', descriptionKey: 'tabDescriptions.transfer', show: settings.isOwner },
  ]

  const visibleTabs = tabItems.filter(t => t.show)
  const selectedTabItem = visibleTabs.find(t => t.key === mobileSelectedTab)

  // Render tab content based on key
  const renderTabContent = (tabKey: TabKey) => {
    switch (tabKey) {
      case 'details':
        return (
          <ChurchDetailsTab
            form={settings.form}
            isLoading={settings.isLoading}
            isAdmin={settings.isAdmin}
            churchData={settings.churchData}
            logoUrl={logoUrl}
            onLogoChange={setLogoUrl}
            onSubmit={settings.onSubmit}
          />
        )
      case 'invite':
        return (
          <InviteMembersTab
            joinCode={settings.churchData?.join_code}
            joinCodeCopied={settings.joinCodeCopied}
            isRegeneratingCode={settings.isRegeneratingCode}
            isAdmin={settings.isAdmin}
            onCopyJoinCode={settings.copyJoinCode}
            onRegenerateJoinCode={settings.handleRegenerateJoinCode}
          />
        )
      case 'locations':
        return settings.canManageLocations ? (
          <LocationsTab
            locations={settings.locations}
            campuses={settings.campuses}
            locationManager={locationManager}
            setLocations={settings.setLocations}
            setError={settings.setError}
            setSuccess={settings.setSuccess}
          />
        ) : null
      case 'campuses':
        return settings.isAdmin ? (
          <CampusesTab
            campuses={settings.campuses}
            campusManager={campusManager}
            setCampuses={settings.setCampuses}
            setError={settings.setError}
            setSuccess={settings.setSuccess}
          />
        ) : null
      case 'presets':
        return settings.isAdmin ? (
          <AgendaPresetsTab
            presets={presets}
            ministries={presetsMinistries}
            setPresets={setPresets}
            setError={settings.setError}
            setSuccess={settings.setSuccess}
          />
        ) : null
      case 'preferences':
        return settings.isAdmin ? (
          <PreferencesTab
            preferencesManager={preferencesManager}
            setError={settings.setError}
            setSuccess={settings.setSuccess}
          />
        ) : null
      case 'transfer':
        return settings.isOwner ? (
          <TransferOwnershipTab
            ownershipTransfer={ownershipTransfer}
            setError={settings.setError}
            setSuccess={settings.setSuccess}
          />
        ) : null
      default:
        return null
    }
  }

  if (!mounted) {
    return null
  }

  // Mobile Layout - Master/Detail pattern
  if (isMobile) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 shrink-0">
            {mobileSelectedTab ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setMobileSelectedTab(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold">{selectedTabItem ? t(selectedTabItem.labelKey) : ''}</h1>
                  <p className="text-xs text-muted-foreground">{selectedTabItem ? t(selectedTabItem.descriptionKey) : ''}</p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('subtitle')}
                </p>
              </div>
            )}
          </div>

          {/* Alerts */}
          {settings.error && (
            <Alert variant="destructive" className="mx-4 mb-2 shrink-0">
              <AlertDescription>{settings.error}</AlertDescription>
            </Alert>
          )}
          {settings.success && (
            <Alert className="mx-4 mb-2 border-green-500 text-green-700 shrink-0">
              <AlertDescription>{settings.success}</AlertDescription>
            </Alert>
          )}
          {!settings.isAdmin && !mobileSelectedTab && (
            <Alert className="mx-4 mb-2 shrink-0">
              <AlertDescription>
                {t('adminOnlyMobile')}
              </AlertDescription>
            </Alert>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            {mobileSelectedTab ? (
              // Detail View - Show selected tab content
              <div className="border border-black dark:border-zinc-700 rounded-lg p-3">
                {renderTabContent(mobileSelectedTab)}
              </div>
            ) : (
              // Master View - Show list of tabs
              <div className="space-y-2">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMobileSelectedTab(tab.key)}
                    className="w-full flex items-center justify-between p-4 border border-black dark:border-zinc-700 rounded-lg bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium">{t(tab.labelKey)}</div>
                      <div className="text-sm text-muted-foreground">{t(tab.descriptionKey)}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop Layout - Side-by-side tabs
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('subtitleDesktop')}
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
              {t('adminOnly')}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue={defaultTab} orientation="vertical" className="h-full flex flex-row gap-6">
            {/* Tab navigation - vertical sidebar */}
            <div className="shrink-0 w-56">
              <TabsList className="flex flex-col w-full h-auto gap-1 p-1 border border-black dark:border-zinc-700 rounded-lg bg-muted/50">
                <TabsTrigger
                  value="details"
                  className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                >
                  {t('tabs.details')}
                </TabsTrigger>
                <TabsTrigger
                  value="invite"
                  className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                >
                  {t('tabs.invite')}
                </TabsTrigger>
                {settings.canManageLocations && (
                  <TabsTrigger
                    value="locations"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    {t('tabs.locations')}
                  </TabsTrigger>
                )}
                {settings.isAdmin && (
                  <TabsTrigger
                    value="campuses"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    {t('tabs.campuses')}
                  </TabsTrigger>
                )}
                {settings.isAdmin && (
                  <TabsTrigger
                    value="presets"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    {t('tabs.presets')}
                  </TabsTrigger>
                )}
                {settings.isAdmin && (
                  <TabsTrigger
                    value="preferences"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    {t('tabs.preferences')}
                  </TabsTrigger>
                )}
                {settings.isOwner && (
                  <TabsTrigger
                    value="transfer"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    {t('tabs.transfer')}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-w-0 min-h-0 overflow-auto">
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
