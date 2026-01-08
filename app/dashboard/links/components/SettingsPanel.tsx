'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { upsertSettings, updateLinksPageEnabled } from '../actions'
import { ColorPicker } from './ColorPicker'
import { SocialLinksEditor } from './SocialLinksEditor'
import {
  BACKGROUND_COLORS,
  type LinkTreeSettingsRow,
  type CardStyle,
  type BorderRadius,
  type SocialLink,
} from '../types'
import type { Json } from '@/types/supabase'

interface SettingsPanelProps {
  settings: LinkTreeSettingsRow | null
  setSettings: (settings: LinkTreeSettingsRow | null) => void
  linksPageEnabled: boolean
  setLinksPageEnabled: (enabled: boolean) => void
}

const CARD_STYLES: { value: CardStyle; label: string }[] = [
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
  { value: 'shadow', label: 'Shadow' },
]

const BORDER_RADII: { value: BorderRadius; label: string }[] = [
  { value: 'rounded-none', label: 'Square' },
  { value: 'rounded-md', label: 'Small' },
  { value: 'rounded-lg', label: 'Medium' },
  { value: 'rounded-xl', label: 'Large' },
  { value: 'rounded-full', label: 'Pill' },
]

export function SettingsPanel({ settings, setSettings, linksPageEnabled, setLinksPageEnabled }: SettingsPanelProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isTogglingPage, setIsTogglingPage] = useState(false)
  const [useGradient, setUseGradient] = useState(
    !!(settings?.background_gradient_start && settings?.background_gradient_end)
  )
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialMount = useRef(true)

  // Form state
  const [title, setTitle] = useState(settings?.title || '')
  const [bio, setBio] = useState(settings?.bio || '')
  const [backgroundColor, setBackgroundColor] = useState(settings?.background_color || '#FFFFFF')
  const [gradientStart, setGradientStart] = useState(settings?.background_gradient_start || '#FFFFFF')
  const [gradientEnd, setGradientEnd] = useState(settings?.background_gradient_end || '#F1F5F9')
  const [cardStyle, setCardStyle] = useState<CardStyle>((settings?.card_style as CardStyle) || 'filled')
  const [borderRadius, setBorderRadius] = useState<BorderRadius>((settings?.card_border_radius as BorderRadius) || 'rounded-lg')
  const [showChurchName, setShowChurchName] = useState(settings?.show_church_name ?? true)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    (settings?.social_links as unknown as SocialLink[]) || []
  )

  // Update preview in real-time when form values change
  const updatePreview = useCallback(() => {
    const previewSettings: LinkTreeSettingsRow = {
      id: settings?.id || '',
      church_id: settings?.church_id || '',
      title: title || null,
      bio: bio || null,
      background_color: useGradient ? null : backgroundColor,
      background_gradient_start: useGradient ? gradientStart : null,
      background_gradient_end: useGradient ? gradientEnd : null,
      card_style: cardStyle,
      card_border_radius: borderRadius,
      avatar_url: settings?.avatar_url || null,
      show_church_name: showChurchName,
      social_links: socialLinks as unknown as Json,
      is_active: settings?.is_active ?? true,
      meta_title: settings?.meta_title || null,
      meta_description: settings?.meta_description || null,
      created_at: settings?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSettings(previewSettings)
  }, [
    settings?.id,
    settings?.church_id,
    settings?.avatar_url,
    settings?.created_at,
    settings?.meta_title,
    settings?.meta_description,
    title,
    bio,
    backgroundColor,
    gradientStart,
    gradientEnd,
    useGradient,
    cardStyle,
    borderRadius,
    showChurchName,
    socialLinks,
    setSettings,
  ])

  // Update preview whenever form values change
  useEffect(() => {
    updatePreview()
  }, [updatePreview])

  // Auto-save function
  const saveSettings = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const data = {
        title: title || null,
        bio: bio || null,
        background_color: useGradient ? null : backgroundColor,
        background_gradient_start: useGradient ? gradientStart : null,
        background_gradient_end: useGradient ? gradientEnd : null,
        card_style: cardStyle,
        card_border_radius: borderRadius,
        show_church_name: showChurchName,
        social_links: socialLinks as unknown as Json,
      }

      const result = await upsertSettings(data)

      if (result.error) {
        toast.error(result.error)
        setSaveStatus('idle')
      } else {
        setSettings(result.settings)
        setSaveStatus('saved')
        // Reset to idle after showing saved status
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    } catch {
      toast.error('Failed to save settings')
      setSaveStatus('idle')
    }
  }, [
    title,
    bio,
    backgroundColor,
    gradientStart,
    gradientEnd,
    useGradient,
    cardStyle,
    borderRadius,
    showChurchName,
    socialLinks,
    setSettings,
  ])

  // Debounced auto-save when form values change
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (1 second delay)
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings()
    }, 1000)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [
    title,
    bio,
    backgroundColor,
    gradientStart,
    gradientEnd,
    useGradient,
    cardStyle,
    borderRadius,
    showChurchName,
    socialLinks,
    saveSettings,
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Settings</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Basic Info</h4>

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs">Page Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your church name or custom title"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-xs">Bio / Description</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short description for your link page"
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Show Church Name</Label>
          <Switch
            checked={showChurchName}
            onCheckedChange={setShowChurchName}
          />
        </div>
      </section>

      {/* Background */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Background</h4>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Use Gradient</Label>
          <Switch
            checked={useGradient}
            onCheckedChange={setUseGradient}
          />
        </div>

        {useGradient ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start</Label>
              <ColorPicker
                value={gradientStart}
                onChange={setGradientStart}
                colors={BACKGROUND_COLORS}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End</Label>
              <ColorPicker
                value={gradientEnd}
                onChange={setGradientEnd}
                colors={BACKGROUND_COLORS}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <ColorPicker
              value={backgroundColor}
              onChange={setBackgroundColor}
              colors={BACKGROUND_COLORS}
            />
          </div>
        )}
      </section>

      {/* Card Style */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Card Style</h4>

        <div className="space-y-1.5">
          <Label className="text-xs">Style</Label>
          <div className="flex flex-wrap gap-1.5">
            {CARD_STYLES.map(style => (
              <Button
                key={style.value}
                variant={cardStyle === style.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCardStyle(style.value)}
                className={`h-7 text-xs ${cardStyle === style.value ? '!bg-brand !text-brand-foreground' : '!border !border-black dark:!border-white'}`}
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Corner Radius</Label>
          <div className="flex flex-wrap gap-1.5">
            {BORDER_RADII.map(radius => (
              <Button
                key={radius.value}
                variant={borderRadius === radius.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBorderRadius(radius.value)}
                className={`h-7 text-xs ${borderRadius === radius.value ? '!bg-brand !text-brand-foreground' : '!border !border-black dark:!border-white'}`}
              >
                {radius.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Social Links</h4>
        <SocialLinksEditor
          links={socialLinks}
          onChange={setSocialLinks}
        />
      </section>

      {/* Status */}
      <section className="space-y-3 pb-8">
        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-xs">Links Page Enabled</Label>
            <p className="text-xs text-muted-foreground">
              When disabled, visitors see a 404
            </p>
          </div>
          <Switch
            checked={linksPageEnabled}
            disabled={isTogglingPage}
            onCheckedChange={async (checked) => {
              setIsTogglingPage(true)
              const result = await updateLinksPageEnabled(checked)
              if (result.error) {
                toast.error(result.error)
              } else {
                setLinksPageEnabled(checked)
                toast.success(checked ? 'Links page enabled' : 'Links page disabled')
              }
              setIsTogglingPage(false)
            }}
          />
        </div>
      </section>
    </div>
  )
}
