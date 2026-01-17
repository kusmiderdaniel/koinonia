import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/permissions'
import Link from 'next/link'
import { FileText, ArrowLeft, LayoutDashboard, Church, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  const adminClient = createServiceRoleClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, user_id, first_name, last_name, email, role, is_super_admin, church_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Check if user is a super admin
  if (!isSuperAdmin(profile)) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <span className="font-semibold text-lg">Admin Panel</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/churches">
              <Button variant="ghost" size="sm" className="gap-2">
                <Church className="h-4 w-4" />
                Churches
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </Button>
            </Link>
            <Link href="/admin/legal-documents">
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                Legal Documents
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}
