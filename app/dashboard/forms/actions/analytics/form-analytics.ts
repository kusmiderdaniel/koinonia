'use server'

import {
  getAuthenticatedUserWithProfile,
  isAuthError,
  requireManagePermission,
  verifyChurchOwnership,
} from '@/lib/utils/server-auth'
import type { FormAnalytics } from './types'

export async function getFormAnalytics(
  formId: string,
  days?: number
): Promise<{ data?: FormAnalytics; error?: string }> {
  const auth = await getAuthenticatedUserWithProfile()
  if (isAuthError(auth)) return { error: auth.error }

  const { profile, adminClient } = auth

  // Check permission - only leaders+ can view analytics
  const permError = requireManagePermission(profile.role, 'view form analytics')
  if (permError) return { error: permError }

  // Verify form belongs to church
  const { error: ownershipError } = await verifyChurchOwnership(
    adminClient,
    'forms',
    formId,
    profile.church_id,
    'church_id',
    'Form not found'
  )
  if (ownershipError) return { error: ownershipError }

  // Calculate start date only if days filter is specified
  let startDate: Date | null = null
  if (days !== undefined) {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
  }

  try {
    // Get analytics events
    let eventsQuery = adminClient
      .from('form_analytics_events')
      .select('event_type, device_type, created_at')
      .eq('form_id', formId)

    if (startDate) {
      eventsQuery = eventsQuery.gte('created_at', startDate.toISOString())
    }

    const { data: events, error: eventsError } = await eventsQuery

    if (eventsError) {
      console.error('Error fetching analytics events:', eventsError)
      return { error: 'Failed to load analytics' }
    }

    // Get submission count
    let submissionCountQuery = adminClient
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', formId)

    if (startDate) {
      submissionCountQuery = submissionCountQuery.gte('submitted_at', startDate.toISOString())
    }

    const { count: submissionCount } = await submissionCountQuery

    // Aggregate totals
    const views = events?.filter((e) => e.event_type === 'view').length || 0
    const starts = events?.filter((e) => e.event_type === 'start').length || 0
    const submissions = submissionCount || 0
    const completionRate = starts > 0 ? Math.round((submissions / starts) * 100) : 0

    // Device breakdown
    const deviceBreakdown = {
      desktop: events?.filter((e) => e.device_type === 'desktop').length || 0,
      mobile: events?.filter((e) => e.device_type === 'mobile').length || 0,
      tablet: events?.filter((e) => e.device_type === 'tablet').length || 0,
    }

    // Build daily counts
    const dailyCounts: Record<string, { views: number; starts: number; submissions: number }> = {}

    events?.forEach((e) => {
      const date = e.created_at.split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { views: 0, starts: 0, submissions: 0 }
      }
      if (e.event_type === 'view') dailyCounts[date].views++
      if (e.event_type === 'start') dailyCounts[date].starts++
    })

    // Get submissions by date
    let submissionsByDateQuery = adminClient
      .from('form_submissions')
      .select('submitted_at')
      .eq('form_id', formId)

    if (startDate) {
      submissionsByDateQuery = submissionsByDateQuery.gte('submitted_at', startDate.toISOString())
    }

    const { data: submissionsByDate } = await submissionsByDateQuery

    submissionsByDate?.forEach((s) => {
      const date = s.submitted_at.split('T')[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = { views: 0, starts: 0, submissions: 0 }
      }
      dailyCounts[date].submissions++
    })

    // Convert to sorted array
    const timeline = Object.entries(dailyCounts)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      data: {
        totals: {
          views,
          starts,
          submissions,
          completionRate,
        },
        deviceBreakdown,
        timeline,
      },
    }
  } catch (error) {
    console.error('Error in getFormAnalytics:', error)
    return { error: 'Failed to load analytics' }
  }
}
