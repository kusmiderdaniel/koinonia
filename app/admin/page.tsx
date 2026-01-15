import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'
import {
  Church,
  Users,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

async function getAdminStats() {
  const adminClient = createServiceRoleClient()

  // Get total churches
  const { count: totalChurches } = await adminClient
    .from('churches')
    .select('*', { count: 'exact', head: true })

  // Get total users (profiles)
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get pending disagreements
  const { count: pendingDisagreements } = await adminClient
    .from('legal_disagreements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get churches created in the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: newChurches } = await adminClient
    .from('churches')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get users created in the last 30 days
  const { count: newUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Get published legal documents count
  const { count: publishedDocs } = await adminClient
    .from('legal_documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  return {
    totalChurches: totalChurches || 0,
    totalUsers: totalUsers || 0,
    pendingDisagreements: pendingDisagreements || 0,
    newChurches: newChurches || 0,
    newUsers: newUsers || 0,
    publishedDocs: publishedDocs || 0,
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and management tools
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
            <Church className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChurches}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.newChurches}</span> in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.newUsers}</span> in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedDocs}</div>
            <p className="text-xs text-muted-foreground">
              Legal documents active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Disagreements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDisagreements}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDisagreements > 0 ? (
                <span className="text-amber-600">Requires attention</span>
              ) : (
                <span className="text-green-600">All clear</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:border-brand/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              Legal Documents
            </CardTitle>
            <CardDescription>
              Manage Terms of Service, Privacy Policy, DPA, and Church Admin Terms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/legal-documents">
              <Button className="w-full bg-brand hover:bg-brand/90 text-brand-foreground">
                Manage Documents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-muted-foreground/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="h-5 w-5 text-muted-foreground" />
              Churches
            </CardTitle>
            <CardDescription>
              View and manage all churches on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-muted-foreground/30 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Users
            </CardTitle>
            <CardDescription>
              View and manage all users across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
