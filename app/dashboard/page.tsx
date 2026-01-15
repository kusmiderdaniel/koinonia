export const dynamic = 'force-dynamic'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getMyAssignments,
  getUpcomingEvents,
  getUnavailabilityCount,
  getCalendarEventsForMember,
  getUpcomingBirthdays,
  getChurchHolidays,
  getCalendarBirthdays,
} from './actions'
import { getPendingDisagreements } from '../legal/disagree/actions'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { MemberDashboard } from '@/components/dashboard/MemberDashboard'
import { createUrgentItems, createWeekItems } from '@/lib/utils/dashboard-helpers'
import { canUserSeeLink, type LinkVisibility } from './links/types'
import type { Task, TaskMinistry, TaskCampus } from './tasks/types'
import type { UserRole } from '@/lib/permissions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  const adminClient = createServiceRoleClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('*, church:churches(*)')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  const firstDayOfWeek = (profile.church?.first_day_of_week ?? 0) as 0 | 1 | 2 | 3 | 4 | 5 | 6
  const timeFormat = (profile.church?.time_format ?? '24h') as '12h' | '24h'
  const role = profile.role as UserRole
  const language = (profile.language === 'pl' ? 'pl' : 'en') as 'en' | 'pl'

  // Get current month/year for calendar
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Check if user is a member (calendar-only view)
  const isMemberOnly = role === 'member'

  // Check if user should see birthdays (leaders, admins, owners)
  const showBirthdays = ['leader', 'admin', 'owner'].includes(role)

  // For members: Fetch calendar events, holidays, pending disagreements, and optionally links
  if (isMemberOnly) {
    const [calendarResult, holidaysResult, pendingDisagreementsResult] = await Promise.all([
      getCalendarEventsForMember(currentMonth, currentYear),
      getChurchHolidays(currentMonth, currentYear),
      getPendingDisagreements(),
    ])

    // Check if links page is enabled for this church
    const linksPageEnabled = profile.church?.links_page_enabled ?? false
    let linksData = null

    if (linksPageEnabled) {
      // Fetch link tree settings and links
      const [settingsResult, linksResult] = await Promise.all([
        adminClient
          .from('link_tree_settings')
          .select('id, church_id, title, bio, avatar_url, background_color, background_gradient_start, background_gradient_end, card_style, card_border_radius, show_church_name, social_links, meta_title, meta_description, is_active, created_at, updated_at')
          .eq('church_id', profile.church_id)
          .single(),
        adminClient
          .from('link_tree_links')
          .select('id, church_id, title, url, description, icon, image_url, card_size, card_color, text_color, hover_effect, hide_label, label_bold, label_italic, label_underline, visibility, start_date, end_date, sort_order, is_active, created_by, created_at, updated_at')
          .eq('church_id', profile.church_id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ])

      if (settingsResult.data && linksResult.data) {
        // Filter links based on member visibility
        const visibleLinks = linksResult.data.filter(link =>
          canUserSeeLink('member', link.visibility as LinkVisibility)
        )

        linksData = {
          settings: {
            title: settingsResult.data.title,
            bio: settingsResult.data.bio,
            backgroundColor: settingsResult.data.background_color,
            backgroundGradientStart: settingsResult.data.background_gradient_start,
            backgroundGradientEnd: settingsResult.data.background_gradient_end,
            cardStyle: settingsResult.data.card_style as 'filled' | 'outline' | 'shadow',
            cardBorderRadius: settingsResult.data.card_border_radius,
            avatarUrl: settingsResult.data.avatar_url,
            showChurchName: settingsResult.data.show_church_name,
            socialLinks: settingsResult.data.social_links as { platform: string; url: string }[] || [],
          },
          links: visibleLinks.map(link => ({
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
            hideLabel: link.hide_label ?? false,
            labelBold: link.label_bold ?? false,
            labelItalic: link.label_italic ?? false,
            labelUnderline: link.label_underline ?? false,
          })),
          church: {
            id: profile.church_id,
            name: profile.church?.name || '',
            logoUrl: profile.church?.logo_url || null,
          },
        }
      }
    }

    return (
      <MemberDashboard
        firstName={profile.first_name}
        initialEvents={calendarResult.data || []}
        initialHolidays={holidaysResult.data || []}
        initialMonth={currentMonth}
        initialYear={currentYear}
        firstDayOfWeek={firstDayOfWeek}
        timeFormat={timeFormat}
        linksData={linksData}
        pendingDisagreements={pendingDisagreementsResult.data || []}
        language={language}
      />
    )
  }

  // Check if links page is enabled for this church (for Quick Links widget)
  const linksPageEnabled = profile.church?.links_page_enabled ?? false
  let linksData = null

  if (linksPageEnabled) {
    // Fetch link tree settings and links
    const [settingsResult, linksResult] = await Promise.all([
      adminClient
        .from('link_tree_settings')
        .select('id, church_id, title, bio, avatar_url, background_color, background_gradient_start, background_gradient_end, card_style, card_border_radius, show_church_name, social_links, meta_title, meta_description, is_active, created_at, updated_at')
        .eq('church_id', profile.church_id)
        .single(),
      adminClient
        .from('link_tree_links')
        .select('id, church_id, title, url, description, icon, image_url, card_size, card_color, text_color, hover_effect, hide_label, label_bold, label_italic, label_underline, visibility, start_date, end_date, sort_order, is_active, created_by, created_at, updated_at')
        .eq('church_id', profile.church_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ])

    if (settingsResult.data && linksResult.data) {
      // Filter links based on user's role visibility
      const visibleLinks = linksResult.data.filter(link =>
        canUserSeeLink(role, link.visibility as LinkVisibility)
      )

      linksData = {
        settings: {
          cardStyle: settingsResult.data.card_style as 'filled' | 'outline' | 'shadow',
          cardBorderRadius: settingsResult.data.card_border_radius,
          socialLinks: settingsResult.data.social_links as { platform: string; url: string }[] || [],
        },
        links: visibleLinks.map(link => ({
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
          hideLabel: link.hide_label ?? false,
          labelBold: link.label_bold ?? false,
          labelItalic: link.label_italic ?? false,
          labelUnderline: link.label_underline ?? false,
        })),
        church: {
          id: profile.church_id,
          name: profile.church?.name || '',
          logoUrl: profile.church?.logo_url || null,
        },
      }
    }
  }

  // For volunteers and above: Fetch full dashboard data
  const [
    assignmentsResult,
    eventsResult,
    unavailabilityResult,
    tasksResult,
    ministriesResult,
    campusesResult,
    membersResult,
    calendarResult,
    birthdaysResult,
    holidaysResult,
    calendarBirthdaysResult,
    pendingDisagreementsResult,
  ] = await Promise.all([
    getMyAssignments(),
    getUpcomingEvents(),
    getUnavailabilityCount(),
    // Full tasks for sheet
    adminClient
      .from('tasks')
      .select(`
        *,
        assignee:profiles!assigned_to (
          id,
          first_name,
          last_name,
          email
        ),
        event:events!event_id (
          id,
          title,
          start_time,
          end_time
        ),
        ministry:ministries!ministry_id (
          id,
          name,
          color
        ),
        campus:campuses!campus_id (
          id,
          name,
          color
        ),
        created_by_profile:profiles!created_by (
          id,
          first_name,
          last_name
        )
      `)
      .eq('assigned_to', profile.id)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(20),
    adminClient
      .from('ministries')
      .select('id, name, color, campus_id')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
    adminClient
      .from('campuses')
      .select('id, name, color, is_default')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('name'),
    adminClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('church_id', profile.church_id)
      .eq('is_active', true)
      .order('first_name'),
    // Calendar events for all roles
    getCalendarEventsForMember(currentMonth, currentYear),
    // Birthdays for leaders+ (for BirthdaysSection)
    showBirthdays ? getUpcomingBirthdays() : Promise.resolve({ data: [] }),
    // Church holidays for calendar
    getChurchHolidays(currentMonth, currentYear),
    // Calendar birthdays for leaders+ (for calendar display)
    showBirthdays ? getCalendarBirthdays(currentMonth, currentYear) : Promise.resolve({ data: [] }),
    // Pending legal disagreements
    getPendingDisagreements(),
  ])

  const assignments = assignmentsResult.data || []
  const events = eventsResult.data || []
  const unavailabilityCount = unavailabilityResult.count
  const tasks = (tasksResult.data || []) as Task[]
  const ministries = (ministriesResult.data || []) as TaskMinistry[]
  const campuses = (campusesResult.data || []) as TaskCampus[]
  const members = membersResult.data || []
  const calendarEvents = calendarResult.data || []
  const birthdays = birthdaysResult.data || []
  const churchHolidays = holidaysResult.data || []
  const calendarBirthdays = calendarBirthdaysResult.data || []

  // Calculate stats for header
  const pendingInvitations = assignments.filter(a => a.status === 'invited')
  const openTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
  const weekAssignments = assignments.filter(a => {
    if (a.status !== 'accepted') return false
    const eventDate = new Date(a.event.start_time)
    const today = new Date()
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    return eventDate >= today && eventDate <= weekEnd
  })

  // Create data for sections (convert full tasks to dashboard format)
  const dashboardTasks = tasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date,
    ministry: t.ministry ? { id: t.ministry.id, name: t.ministry.name, color: t.ministry.color } : null,
    event: t.event ? { id: t.event.id, title: t.event.title } : null,
  }))

  const urgentItems = createUrgentItems(assignments, dashboardTasks, timeFormat)
  const weekItems = createWeekItems(assignments, dashboardTasks, timeFormat)

  // Check if user can create events (admin or owner)
  const canCreateEvents = ['admin', 'owner'].includes(role)

  return (
    <DashboardClient
      role={role}
      firstName={profile.first_name}
      pendingCount={pendingInvitations.length}
      tasksCount={openTasks.length}
      weekCount={weekAssignments.length}
      urgentItems={urgentItems}
      weekItems={weekItems}
      events={events}
      unavailabilityCount={unavailabilityCount}
      tasks={tasks}
      ministries={ministries}
      campuses={campuses}
      members={members}
      weekStartsOn={firstDayOfWeek}
      timeFormat={timeFormat}
      calendarEvents={calendarEvents}
      birthdays={birthdays}
      churchHolidays={churchHolidays}
      calendarBirthdays={calendarBirthdays}
      canCreateEvents={canCreateEvents}
      linksData={linksData}
      pendingDisagreements={pendingDisagreementsResult.data || []}
      language={language}
    />
  )
}
