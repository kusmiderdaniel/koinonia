'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { isLeaderOrAbove } from '@/lib/permissions'
import type {
  LinkTreeSettingsInsert,
  LinkTreeSettingsUpdate,
  LinkTreeLinkInsert,
  LinkTreeLinkUpdate,
  AnalyticsSummary,
  LinkWithStats,
} from './types'

// Helper to get current user's profile with church_id
async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const adminClient = createServiceRoleClient()
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('id, church_id, role')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Profile not found')
  }

  // Check if user has permission (leader+)
  if (!isLeaderOrAbove(profile.role)) {
    throw new Error('Permission denied')
  }

  return profile
}

// ============================================================================
// SETTINGS ACTIONS
// ============================================================================

export async function getSettings() {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const { data, error } = await adminClient
    .from('link_tree_settings')
    .select('id, church_id, title, bio, avatar_url, background_color, background_gradient_start, background_gradient_end, card_style, card_border_radius, show_church_name, social_links, meta_title, meta_description, is_active, created_at, updated_at')
    .eq('church_id', profile.church_id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" - that's OK
    console.error('Error fetching settings:', error)
    return { settings: null, error: error.message }
  }

  return { settings: data, error: null }
}

export async function upsertSettings(data: Partial<LinkTreeSettingsInsert>) {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  // Check if settings already exist
  const { data: existing } = await adminClient
    .from('link_tree_settings')
    .select('id')
    .eq('church_id', profile.church_id)
    .single()

  let result
  if (existing) {
    // Update
    result = await adminClient
      .from('link_tree_settings')
      .update(data as LinkTreeSettingsUpdate)
      .eq('church_id', profile.church_id)
      .select()
      .single()
  } else {
    // Insert
    result = await adminClient
      .from('link_tree_settings')
      .insert({
        ...data,
        church_id: profile.church_id,
      } as LinkTreeSettingsInsert)
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error upserting settings:', result.error)
    return { settings: null, error: result.error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  revalidatePath('/links')

  return { settings: result.data, error: null }
}

// ============================================================================
// LINKS ACTIONS
// ============================================================================

export async function getLinks() {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const { data, error } = await adminClient
    .from('link_tree_links')
    .select('id, church_id, title, url, description, icon, image_url, card_size, card_color, text_color, hover_effect, hide_label, label_bold, label_italic, label_underline, visibility, start_date, end_date, sort_order, is_active, created_by, created_at, updated_at')
    .eq('church_id', profile.church_id)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching links:', error)
    return { links: [], error: error.message }
  }

  return { links: data || [], error: null }
}

export async function createLink(data: Omit<LinkTreeLinkInsert, 'church_id' | 'created_by'>) {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  // Get the max sort_order to append at the end
  const { data: existingLinks } = await adminClient
    .from('link_tree_links')
    .select('sort_order')
    .eq('church_id', profile.church_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxSortOrder = existingLinks?.[0]?.sort_order ?? -1

  const { data: newLink, error } = await adminClient
    .from('link_tree_links')
    .insert({
      ...data,
      church_id: profile.church_id,
      created_by: profile.id,
      sort_order: maxSortOrder + 1,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating link:', error)
    return { link: null, error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  revalidatePath('/links')

  return { link: newLink, error: null }
}

export async function updateLink(id: string, data: LinkTreeLinkUpdate) {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const { data: updatedLink, error } = await adminClient
    .from('link_tree_links')
    .update(data)
    .eq('id', id)
    .eq('church_id', profile.church_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating link:', error)
    return { link: null, error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  revalidatePath('/links')

  return { link: updatedLink, error: null }
}

export async function deleteLink(id: string) {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const { error } = await adminClient
    .from('link_tree_links')
    .delete()
    .eq('id', id)
    .eq('church_id', profile.church_id)

  if (error) {
    console.error('Error deleting link:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  revalidatePath('/links')

  return { success: true, error: null }
}

export async function reorderLinks(orderedIds: string[]) {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  // Update sort_order for each link
  const updates = orderedIds.map((id, index) =>
    adminClient
      .from('link_tree_links')
      .update({ sort_order: index })
      .eq('id', id)
      .eq('church_id', profile.church_id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some(r => r.error)

  if (hasError) {
    console.error('Error reordering links')
    return { success: false, error: 'Failed to reorder links' }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  revalidatePath('/links')

  return { success: true, error: null }
}

// ============================================================================
// ANALYTICS ACTIONS
// ============================================================================

export async function getAnalytics(): Promise<{ analytics: AnalyticsSummary | null; error: string | null }> {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  // Get all links
  const { data: links, error: linksError } = await adminClient
    .from('link_tree_links')
    .select('id, title')
    .eq('church_id', profile.church_id)
    .order('sort_order', { ascending: true })

  if (linksError) {
    return { analytics: null, error: linksError.message }
  }

  // Get click counts
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(todayStart)
  monthStart.setMonth(monthStart.getMonth() - 1)
  const chartStartDate = new Date(todayStart)
  chartStartDate.setDate(chartStartDate.getDate() - 13) // Last 14 days for chart

  // Get clicks from last 30 days only (all we need for analytics)
  const { data: clicks, error: clicksError } = await adminClient
    .from('link_tree_clicks')
    .select('link_id, clicked_at')
    .eq('church_id', profile.church_id)
    .gte('clicked_at', monthStart.toISOString())

  if (clicksError) {
    return { analytics: null, error: clicksError.message }
  }

  // Calculate stats
  const allClicks = clicks || []
  const totalClicks = allClicks.length
  const clicksToday = allClicks.filter(c => new Date(c.clicked_at) >= todayStart).length
  const clicksThisWeek = allClicks.filter(c => new Date(c.clicked_at) >= weekStart).length
  const clicksThisMonth = allClicks.filter(c => new Date(c.clicked_at) >= monthStart).length

  // Calculate per-link stats
  const linksStats: LinkWithStats[] = (links || []).map(link => {
    const linkClicks = allClicks.filter(c => c.link_id === link.id)
    return {
      ...link,
      click_count: linkClicks.length,
      clicks_today: linkClicks.filter(c => new Date(c.clicked_at) >= todayStart).length,
      clicks_this_week: linkClicks.filter(c => new Date(c.clicked_at) >= weekStart).length,
      clicks_this_month: linkClicks.filter(c => new Date(c.clicked_at) >= monthStart).length,
    } as LinkWithStats
  })

  // Generate daily click data for the last 14 days
  const dailyClicks: { date: string; [key: string]: number | string }[] = []

  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(chartStartDate)
    currentDate.setDate(chartStartDate.getDate() + i)
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)

    const dateStr = currentDate.toISOString().split('T')[0]
    const dayData: { date: string; [key: string]: number | string } = { date: dateStr }

    // Count clicks per link for this day
    for (const link of links || []) {
      const linkDayClicks = allClicks.filter(c => {
        const clickDate = new Date(c.clicked_at)
        return c.link_id === link.id && clickDate >= currentDate && clickDate < nextDate
      }).length
      dayData[link.id] = linkDayClicks
    }

    dailyClicks.push(dayData)
  }

  return {
    analytics: {
      total_clicks: totalClicks,
      clicks_today: clicksToday,
      clicks_this_week: clicksThisWeek,
      clicks_this_month: clicksThisMonth,
      links_stats: linksStats,
      daily_clicks: dailyClicks,
    },
    error: null,
  }
}

// Get church info for preview URL and display
export async function getChurchInfo(): Promise<{ subdomain: string | null; name: string | null; logoUrl: string | null; linksPageEnabled: boolean; error: string | null }> {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const { data: church, error } = await adminClient
    .from('churches')
    .select('subdomain, name, logo_url, links_page_enabled')
    .eq('id', profile.church_id)
    .single()

  if (error) {
    return { subdomain: null, name: null, logoUrl: null, linksPageEnabled: false, error: error.message }
  }

  return { subdomain: church?.subdomain || null, name: church?.name || null, logoUrl: church?.logo_url || null, linksPageEnabled: church?.links_page_enabled ?? false, error: null }
}

// Toggle links page enabled status
export async function updateLinksPageEnabled(enabled: boolean): Promise<{ success: boolean; error: string | null }> {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const { error } = await adminClient
    .from('churches')
    .update({ links_page_enabled: enabled })
    .eq('id', profile.church_id)

  if (error) {
    console.error('Error updating links_page_enabled:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/links')
  revalidatePath('/dashboard')
  revalidatePath('/links')

  return { success: true, error: null }
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

export async function uploadLinkImage(formData: FormData): Promise<{ url: string | null; error: string | null }> {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  const file = formData.get('file') as File
  if (!file) {
    return { url: null, error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { url: null, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: 'Image size must be less than 5MB' }
  }

  // Generate unique file path
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${profile.church_id}/${Date.now()}.${fileExt}`

  // Convert File to ArrayBuffer for server action compatibility
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload to storage
  const { error: uploadError } = await adminClient.storage
    .from('link-images')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    return { url: null, error: 'Failed to upload image' }
  }

  // Get public URL
  const { data: urlData } = adminClient.storage
    .from('link-images')
    .getPublicUrl(fileName)

  return { url: urlData.publicUrl, error: null }
}

export async function deleteLinkImage(imageUrl: string): Promise<{ success: boolean; error: string | null }> {
  const profile = await getCurrentProfile()
  const adminClient = createServiceRoleClient()

  // Extract file path from URL
  const urlParts = imageUrl.split('/link-images/')
  if (urlParts.length !== 2) {
    return { success: false, error: 'Invalid image URL' }
  }

  const filePath = urlParts[1]

  // Verify the file belongs to this church
  if (!filePath.startsWith(profile.church_id)) {
    return { success: false, error: 'Access denied' }
  }

  // Delete from storage
  const { error } = await adminClient.storage
    .from('link-images')
    .remove([filePath])

  if (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: 'Failed to delete image' }
  }

  return { success: true, error: null }
}
