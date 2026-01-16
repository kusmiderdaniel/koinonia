'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Users,
  Search,
  Eye,
  Mail,
  Phone,
  Calendar,
  Church,
  Shield,
  Heart,
  FileText,
  Globe,
  TrendingUp,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { UserWithChurch, GrowthDataPoint } from './actions'
import { getUserDetails, toggleSuperAdmin } from './actions'

const UserGrowthChart = dynamic(
  () => import('./UserGrowthChart').then((mod) => ({ default: mod.UserGrowthChart })),
  {
    loading: () => <Skeleton className="h-[280px] w-full" />,
    ssr: false,
  }
)

interface UsersClientProps {
  initialUsers: UserWithChurch[]
  growthData: GrowthDataPoint[]
}

interface UserDetails {
  user: UserWithChurch & {
    phone: string | null
    date_of_birth: string | null
    bio: string | null
    avatar_url: string | null
    language: string | null
  }
  stats: {
    eventsAttended: number
    ministriesJoined: number
    formsSubmitted: number
  }
  ministries: {
    id: string
    name: string
    role: string
  }[]
}

export function UsersClient({ initialUsers, growthData }: UsersClientProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserWithChurch[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isTogglingAdmin, setIsTogglingAdmin] = useState(false)

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.church?.name.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  })

  const handleViewDetails = async (userId: string) => {
    setIsLoadingDetails(true)
    const result = await getUserDetails(userId)
    if (result.data) {
      setSelectedUser(result.data)
    }
    setIsLoadingDetails(false)
  }

  const handleToggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    setIsTogglingAdmin(true)
    const result = await toggleSuperAdmin(userId, !currentStatus)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Super admin status ${!currentStatus ? 'granted' : 'revoked'}`)
      // Update local state
      setUsers(users.map(u =>
        u.id === userId ? { ...u, is_super_admin: !currentStatus } : u
      ))
      if (selectedUser && selectedUser.user.id === userId) {
        setSelectedUser({
          ...selectedUser,
          user: { ...selectedUser.user, is_super_admin: !currentStatus }
        })
      }
      router.refresh()
    }
    setIsTogglingAdmin(false)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'leader':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage all users on the platform ({users.length} total)
          </p>
        </div>
      </div>

      {/* Growth Chart */}
      {growthData.length > 0 && (
        <Card className="border">
          <CardHeader className="pt-6 pb-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              User Growth
            </CardTitle>
            <CardDescription>
              Total users over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-6">
            <UserGrowthChart data={growthData} />
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, church, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card className="border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Church</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No users match your search' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.first_name[0]}{user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {user.first_name} {user.last_name}
                            {user.is_super_admin && (
                              <Shield className="h-3.5 w-3.5 text-amber-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.church ? (
                        <div className="flex items-center gap-2">
                          <Church className="h-4 w-4 text-muted-foreground" />
                          <span>{user.church.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user.id)}
                        disabled={isLoadingDetails}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>User Details</DialogTitle>
          </VisuallyHidden>
          {selectedUser && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-background p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-lg shrink-0">
                    <AvatarImage src={selectedUser.user.avatar_url || undefined} />
                    <AvatarFallback className="bg-brand/10 text-brand text-lg">
                      {selectedUser.user.first_name[0]}{selectedUser.user.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold truncate">
                        {selectedUser.user.first_name} {selectedUser.user.last_name}
                      </h2>
                      {selectedUser.user.is_super_admin && (
                        <Badge className="bg-amber-500 text-white text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedUser.user.email}
                    </p>
                    {selectedUser.user.church && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                        <Church className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{selectedUser.user.church.name}</span>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">
                          {selectedUser.user.role}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border shadow-sm">
                    <Calendar className="h-4 w-4 mx-auto text-green-500 mb-1" />
                    <div className="text-xl font-bold">{selectedUser.stats.eventsAttended}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border shadow-sm">
                    <Heart className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                    <div className="text-xl font-bold">{selectedUser.stats.ministriesJoined}</div>
                    <div className="text-xs text-muted-foreground">Ministries</div>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border shadow-sm">
                    <FileText className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                    <div className="text-xl font-bold">{selectedUser.stats.formsSubmitted}</div>
                    <div className="text-xs text-muted-foreground">Forms</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[45vh]">
                <div className="p-5 space-y-5">
                  {/* Contact Info */}
                  {(selectedUser.user.email || selectedUser.user.phone) && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Contact
                      </h3>
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                        {selectedUser.user.email && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="text-sm">{selectedUser.user.email}</span>
                          </div>
                        )}
                        {selectedUser.user.phone && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <Phone className="h-4 w-4 text-green-500" />
                            </div>
                            <span className="text-sm">{selectedUser.user.phone}</span>
                          </div>
                        )}
                        {selectedUser.user.language && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Globe className="h-4 w-4 text-purple-500" />
                            </div>
                            <span className="text-sm capitalize">{selectedUser.user.language}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ministries */}
                  {selectedUser.ministries.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Ministries ({selectedUser.ministries.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedUser.ministries.map((ministry) => (
                          <div
                            key={ministry.id}
                            className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Heart className="h-4 w-4 text-purple-500" />
                              </div>
                              <span className="font-medium text-sm">{ministry.name}</span>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {ministry.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Super Admin Toggle */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Platform Permissions
                    </h3>
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-amber-500" />
                          </div>
                          <div>
                            <Label htmlFor="super-admin" className="text-sm font-medium">
                              Super Admin
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Grant access to admin panel and platform management
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="super-admin"
                          checked={selectedUser.user.is_super_admin === true}
                          onCheckedChange={() => handleToggleSuperAdmin(
                            selectedUser.user.id,
                            selectedUser.user.is_super_admin === true
                          )}
                          disabled={isTogglingAdmin}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedUser.user.bio && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Bio
                      </h3>
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
                        {selectedUser.user.bio}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t bg-muted/20 px-6 py-3 flex justify-between text-xs text-muted-foreground">
                <span>Joined {format(new Date(selectedUser.user.created_at), 'MMM d, yyyy')}</span>
                <span>Updated {format(new Date(selectedUser.user.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
