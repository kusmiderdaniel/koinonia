'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { upsertSettings } from '../actions'
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

interface SettingsTabProps {
  settings: LinkTreeSettingsRow | null
  setSettings: (settings: LinkTreeSettingsRow | null) => void
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

export function SettingsTab({ settings, setSettings }: SettingsTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [useGradient, setUseGradient] = useState(
    !!(settings?.background_gradient_start && settings?.background_gradient_end)
  )

  // Form state
  const [title, setTitle] = useState(settings?.title || '')
  const [bio, setBio] = useState(settings?.bio || '')
  const [backgroundColor, setBackgroundColor] = useState(settings?.background_color || '#FFFFFF')
  const [gradientStart, setGradientStart] = useState(settings?.background_gradient_start || '#FFFFFF')
  const [gradientEnd, setGradientEnd] = useState(settings?.background_gradient_end || '#F1F5F9')
  const [cardStyle, setCardStyle] = useState<CardStyle>((settings?.card_style as CardStyle) || 'filled')
  const [borderRadius, setBorderRadius] = useState<BorderRadius>((settings?.card_border_radius as BorderRadius) || 'rounded-lg')
  const [showChurchName, setShowChurchName] = useState(settings?.show_church_name ?? true)
  const [isActive, setIsActive] = useState(settings?.is_active ?? true)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    (settings?.social_links as unknown as SocialLink[]) || []
  )

  const handleSave = async () => {
    setIsSaving(true)
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
        is_active: isActive,
        social_links: socialLinks as unknown as Json,
      }

      const result = await upsertSettings(data)

      if (result.error) {
        toast.error(result.error)
      } else {
        setSettings(result.settings)
        toast.success('Settings saved')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="font-semibold">Basic Info</h3>

        <div className="space-y-2">
          <Label htmlFor="title">Page Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your church name or custom title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio / Description</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short description for your link page"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Church Name</Label>
            <p className="text-sm text-muted-foreground">
              Display church name if no custom title is set
            </p>
          </div>
          <Switch
            checked={showChurchName}
            onCheckedChange={setShowChurchName}
          />
        </div>
      </section>

      {/* Background */}
      <section className="space-y-4">
        <h3 className="font-semibold">Background</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Use Gradient</Label>
            <p className="text-sm text-muted-foreground">
              Apply a gradient background instead of solid color
            </p>
          </div>
          <Switch
            checked={useGradient}
            onCheckedChange={setUseGradient}
          />
        </div>

        {useGradient ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gradient Start</Label>
              <ColorPicker
                value={gradientStart}
                onChange={setGradientStart}
                colors={BACKGROUND_COLORS}
              />
            </div>
            <div className="space-y-2">
              <Label>Gradient End</Label>
              <ColorPicker
                value={gradientEnd}
                onChange={setGradientEnd}
                colors={BACKGROUND_COLORS}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Background Color</Label>
            <ColorPicker
              value={backgroundColor}
              onChange={setBackgroundColor}
              colors={BACKGROUND_COLORS}
            />
          </div>
        )}
      </section>

      {/* Card Style */}
      <section className="space-y-4">
        <h3 className="font-semibold">Card Style</h3>

        <div className="space-y-2">
          <Label>Style</Label>
          <div className="flex flex-wrap gap-2">
            {CARD_STYLES.map(style => (
              <Button
                key={style.value}
                variant={cardStyle === style.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCardStyle(style.value)}
                className={cardStyle === style.value ? '!bg-brand !text-brand-foreground' : '!border !border-black dark:!border-zinc-600'}
              >
                {style.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Corner Radius</Label>
          <div className="flex flex-wrap gap-2">
            {BORDER_RADII.map(radius => (
              <Button
                key={radius.value}
                variant={borderRadius === radius.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBorderRadius(radius.value)}
                className={borderRadius === radius.value ? '!bg-brand !text-brand-foreground' : '!border !border-black dark:!border-zinc-600'}
              >
                {radius.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-4">
        <h3 className="font-semibold">Social Links</h3>
        <p className="text-sm text-muted-foreground">
          Add social media links to display at the bottom of your page
        </p>
        <SocialLinksEditor
          links={socialLinks}
          onChange={setSocialLinks}
        />
      </section>

      {/* Status */}
      <section className="space-y-4 pb-8">
        <h3 className="font-semibold">Status</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Page Active</Label>
            <p className="text-sm text-muted-foreground">
              When disabled, visitors will see a 404 page
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
