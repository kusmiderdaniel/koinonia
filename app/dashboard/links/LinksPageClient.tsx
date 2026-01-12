'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Link2, BarChart3, ExternalLink, Copy, Check, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { LinksListPanel } from './components/LinksListPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { LivePreview } from './components/LivePreview'
import { AnalyticsTab } from './components/AnalyticsTab'
import { updateLinksPageEnabled } from './actions'
import type { LinkTreeSettingsRow, LinkTreeLinkRow, AnalyticsSummary } from './types'

interface LinksPageClientProps {
  initialSettings: LinkTreeSettingsRow | null
  initialLinks: LinkTreeLinkRow[]
  initialAnalytics: AnalyticsSummary | null
  churchSubdomain: string | null
  churchName: string | null
  churchLogo: string | null
  linksPageEnabled: boolean
}

export function LinksPageClient({
  initialSettings,
  initialLinks,
  initialAnalytics,
  churchSubdomain,
  churchName,
  churchLogo,
  linksPageEnabled: initialLinksPageEnabled,
}: LinksPageClientProps) {
  const t = useTranslations('links')
  const [desktopTab, setDesktopTab] = useState('links')
  const [mobileTab, setMobileTab] = useState('links')
  const [settings, setSettings] = useState<LinkTreeSettingsRow | null>(initialSettings)
  const [links, setLinks] = useState<LinkTreeLinkRow[]>(initialLinks)
  const [linksPageEnabled, setLinksPageEnabled] = useState(initialLinksPageEnabled)
  const [isTogglingPage, setIsTogglingPage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Build preview URL on client side only
  useEffect(() => {
    if (churchSubdomain && typeof window !== 'undefined') {
      // Use NEXT_PUBLIC_SITE_URL or fall back to current host
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const url = new URL(baseUrl)
      // Prepend church subdomain to the hostname
      const subdomainHost = `${churchSubdomain}.${url.hostname}`
      const fullUrl = `${url.protocol}//${subdomainHost}${url.port ? ':' + url.port : ''}/links`
      setPreviewUrl(fullUrl)
      setDisplayUrl(`${subdomainHost}/links`)
    }
  }, [churchSubdomain])

  const handleCopyUrl = async () => {
    if (previewUrl) {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleToggleLinksPage = async (checked: boolean) => {
    setIsTogglingPage(true)
    const result = await updateLinksPageEnabled(checked)
    if (result.error) {
      toast.error(result.error)
    } else {
      setLinksPageEnabled(checked)
      toast.success(checked ? t('toast.pageEnabled') : t('toast.pageDisabled'))
    }
    setIsTogglingPage(false)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="links-page-enabled-header"
                checked={linksPageEnabled}
                disabled={isTogglingPage}
                onCheckedChange={handleToggleLinksPage}
              />
              <Label
                htmlFor="links-page-enabled-header"
                className="text-xs md:text-sm font-medium cursor-pointer"
              >
                {linksPageEnabled ? t('status.enabled') : t('status.disabled')}
              </Label>
            </div>

            {/* URL Display */}
            {displayUrl && (
              <div className="flex items-center gap-1 md:gap-2 bg-muted/50 border border-black dark:border-zinc-700 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                <Link2 className="h-3.5 md:h-4 w-3.5 md:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium truncate max-w-[180px] md:max-w-none">{displayUrl}</span>
                <div className="flex items-center flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 md:h-7 md:w-7"
                    onClick={handleCopyUrl}
                  >
                    {copied ? (
                      <Check className="h-3 md:h-3.5 w-3 md:w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3 md:h-3.5 w-3 md:w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 md:h-7 md:w-7"
                    asChild
                  >
                    <a href={previewUrl!} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 md:h-3.5 w-3 md:w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout (lg+) - Three tabs */}
        <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden flex-col">
          <Tabs value={desktopTab} onValueChange={setDesktopTab} className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4 shrink-0">
              <TabsList className="w-auto border border-black dark:border-zinc-700">
                <TabsTrigger
                  value="links"
                  className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                >
                  <Link2 className="w-4 h-4" />
                  {t('tabs.links')}
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                >
                  <Settings className="w-4 h-4" />
                  {t('tabs.settings')}
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center gap-2 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground"
                >
                  <BarChart3 className="w-4 h-4" />
                  {t('tabs.analytics')}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="links" className="flex-1 min-h-0 mt-0">
              <div className="flex gap-4 h-full">
                {/* Links List - 70% */}
                <div className="w-[70%] overflow-auto border border-black dark:border-zinc-700 rounded-lg p-4">
                  <LinksListPanel
                    links={links}
                    setLinks={setLinks}
                    analytics={initialAnalytics}
                  />
                </div>

                {/* Live Preview - 30% */}
                <div className="w-[30%] flex flex-col">
                  <LivePreview
                    settings={settings}
                    links={links}
                    churchName={churchName || undefined}
                    churchLogo={churchLogo}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 mt-0 overflow-auto">
              <div className="border border-black dark:border-zinc-700 rounded-lg p-4 max-w-2xl">
                <SettingsPanel
                  settings={settings}
                  setSettings={setSettings}
                  linksPageEnabled={linksPageEnabled}
                  setLinksPageEnabled={setLinksPageEnabled}
                />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 min-h-0 mt-0 overflow-auto">
              <div className="border border-black dark:border-zinc-700 rounded-lg p-4">
                <AnalyticsTab
                  analytics={initialAnalytics}
                  links={links}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Layout (< lg) - Three tabs */}
        <div className="flex lg:hidden flex-1 min-h-0 overflow-hidden">
          <div className="border border-black dark:border-zinc-700 rounded-lg h-full flex flex-col w-full">
            <Tabs value={mobileTab} onValueChange={setMobileTab} className="flex flex-col h-full">
              <TabsList className="w-full bg-muted/50 border-b border-black dark:border-zinc-700 rounded-t-lg rounded-b-none p-1 gap-1 shrink-0">
                <TabsTrigger
                  value="links"
                  className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground rounded-md"
                >
                  {t('tabs.links')}
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground rounded-md"
                >
                  {t('tabs.settings')}
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex-1 data-[state=active]:bg-brand data-[state=active]:text-brand-foreground rounded-md"
                >
                  {t('tabs.analytics')}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto p-4">
                <TabsContent value="links" className="mt-0 h-full">
                  <LinksListPanel
                    links={links}
                    setLinks={setLinks}
                    analytics={initialAnalytics}
                  />
                </TabsContent>

                <TabsContent value="settings" className="mt-0 h-full">
                  <SettingsPanel
                    settings={settings}
                    setSettings={setSettings}
                    linksPageEnabled={linksPageEnabled}
                    setLinksPageEnabled={setLinksPageEnabled}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0 h-full">
                  <AnalyticsTab
                    analytics={initialAnalytics}
                    links={links}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
