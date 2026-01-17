import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { LinkTreeClient } from '@/app/links/LinkTreeClient'
import { canUserSeeLink } from '@/app/dashboard/links/types'
import type { LinkVisibility } from '@/app/dashboard/links/types'

interface PageProps {
  params: Promise<{ churchSlug: string }>
}

export default async function ChurchLinksPage({ params }: PageProps) {
  const { churchSlug } = await params

  if (!churchSlug) {
    notFound()
  }

  const adminClient = createServiceRoleClient()

  // Look up church by subdomain (slug)
  const { data: church, error: churchError } = await adminClient
    .from('churches')
    .select('id, name, logo_url, links_page_enabled')
    .eq('subdomain', churchSlug)
    .single()

  if (churchError || !church) {
    notFound()
  }

  // If links page is not enabled for this church, show 404
  if (!church.links_page_enabled) {
    notFound()
  }

  // Get link tree settings
  const { data: settings } = await adminClient
    .from('link_tree_settings')
    .select('id, church_id, title, bio, avatar_url, background_color, background_gradient_start, background_gradient_end, card_style, card_border_radius, show_church_name, social_links, meta_title, meta_description, is_active, created_at, updated_at')
    .eq('church_id', church.id)
    .single()

  // If no settings exist, show 404
  if (!settings) {
    notFound()
  }

  // Get all active links ordered by sort_order
  const now = new Date().toISOString()
  const { data: allLinks } = await adminClient
    .from('link_tree_links')
    .select('id, church_id, title, url, description, icon, image_url, card_size, card_color, text_color, hover_effect, hide_label, label_bold, label_italic, label_underline, visibility, start_date, end_date, sort_order, is_active, created_by, created_at, updated_at')
    .eq('church_id', church.id)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('sort_order', { ascending: true })

  // Check if user is logged in and get their role
  let userRole: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Get user's profile to check role
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .eq('church_id', church.id)
        .single()

      if (profile) {
        userRole = profile.role
      }
    }
  } catch {
    // User not logged in, that's fine
  }

  // Filter links based on visibility and user role
  const visibleLinks = (allLinks || []).filter(link =>
    canUserSeeLink(userRole, link.visibility as LinkVisibility)
  )

  return (
    <LinkTreeClient
      church={{
        id: church.id,
        name: church.name,
        logoUrl: church.logo_url,
      }}
      settings={{
        title: settings.title,
        bio: settings.bio,
        backgroundColor: settings.background_color,
        backgroundGradientStart: settings.background_gradient_start,
        backgroundGradientEnd: settings.background_gradient_end,
        cardStyle: settings.card_style as 'filled' | 'outline' | 'shadow',
        cardBorderRadius: settings.card_border_radius,
        avatarUrl: settings.avatar_url,
        showChurchName: settings.show_church_name,
        socialLinks: settings.social_links as { platform: string; url: string }[] || [],
      }}
      links={visibleLinks.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        icon: link.icon,
        imageUrl: link.image_url,
        cardColor: link.card_color,
        textColor: link.text_color,
        cardSize: (link.card_size as 'small' | 'medium' | 'large') || 'medium',
        hoverEffect: link.hover_effect as 'none' | 'scale' | 'glow' | 'lift',
        visibility: link.visibility as LinkVisibility,
        hideLabel: link.hide_label ?? false,
        labelBold: link.label_bold ?? false,
        labelItalic: link.label_italic ?? false,
        labelUnderline: link.label_underline ?? false,
        labelAlign: (link.label_align as 'left' | 'center' | 'right') ?? 'center',
      }))}
      userRole={userRole}
    />
  )
}
