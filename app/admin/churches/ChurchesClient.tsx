'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Church,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  ExternalLink,
  Eye,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChurchWithStats } from './actions'
import { getChurchDetails } from './actions'

interface ChurchesClientProps {
  initialChurches: ChurchWithStats[]
}

interface ChurchDetails {
  church: ChurchWithStats
  members: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    role: string
    created_at: string
  }[]
  stats: {
    totalEvents: number
    totalMinistries: number
    totalForms: number
  }
}

export function ChurchesClient({ initialChurches }: ChurchesClientProps) {
  const [churches] = useState<ChurchWithStats[]>(initialChurches)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChurch, setSelectedChurch] = useState<ChurchDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const filteredChurches = churches.filter((church) => {
    const query = searchQuery.toLowerCase()
    return (
      church.name.toLowerCase().includes(query) ||
      church.subdomain.toLowerCase().includes(query) ||
      church.city?.toLowerCase().includes(query) ||
      church.country?.toLowerCase().includes(query) ||
      church.owner?.first_name.toLowerCase().includes(query) ||
      church.owner?.last_name.toLowerCase().includes(query) ||
      church.owner?.email?.toLowerCase().includes(query)
    )
  })

  const handleViewDetails = async (churchId: string) => {
    setIsLoadingDetails(true)
    const result = await getChurchDetails(churchId)
    if (result.data) {
      setSelectedChurch(result.data)
    }
    setIsLoadingDetails(false)
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
          <h1 className="text-3xl font-bold tracking-tight">Churches</h1>
          <p className="text-muted-foreground mt-1">
            Manage all churches on the platform ({churches.length} total)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, subdomain, city, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Churches Table */}
      <Card className="border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Church</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChurches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No churches match your search' : 'No churches found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredChurches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={church.logo_url || undefined} alt={church.name} />
                          <AvatarFallback>
                            <Church className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{church.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {church.subdomain}.koinonia.app
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {church.owner ? (
                        <div>
                          <div className="font-medium">
                            {church.owner.first_name} {church.owner.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {church.owner.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No owner</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {church.member_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {church.city || church.country ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {[church.city, church.country].filter(Boolean).join(', ')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(church.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(church.id)}
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

      {/* Church Details Dialog */}
      <Dialog open={!!selectedChurch} onOpenChange={(open) => !open && setSelectedChurch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedChurch?.church.logo_url || undefined} />
                <AvatarFallback>
                  <Church className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {selectedChurch?.church.name}
            </DialogTitle>
            <DialogDescription>
              {selectedChurch?.church.subdomain}.koinonia.app
            </DialogDescription>
          </DialogHeader>

          {selectedChurch && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="border py-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedChurch.church.member_count}</div>
                    </CardContent>
                  </Card>
                  <Card className="border py-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedChurch.stats.totalEvents}</div>
                    </CardContent>
                  </Card>
                  <Card className="border py-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ministries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedChurch.stats.totalMinistries}</div>
                    </CardContent>
                  </Card>
                  <Card className="border py-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Forms
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedChurch.stats.totalForms}</div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedChurch.church.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedChurch.church.email}</span>
                      </div>
                    )}
                    {selectedChurch.church.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedChurch.church.phone}</span>
                      </div>
                    )}
                    {selectedChurch.church.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={selectedChurch.church.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline flex items-center gap-1"
                        >
                          {selectedChurch.church.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {(selectedChurch.church.city || selectedChurch.church.country) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {[selectedChurch.church.city, selectedChurch.church.country]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Members */}
                <div>
                  <h3 className="font-semibold mb-3">Members ({selectedChurch.members.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedChurch.members.slice(0, 20).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <div className="font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                      </div>
                    ))}
                    {selectedChurch.members.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        +{selectedChurch.members.length - 20} more members
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <div>
                    Created: {format(new Date(selectedChurch.church.created_at), 'PPP')}
                  </div>
                  <div>
                    Updated: {format(new Date(selectedChurch.church.updated_at), 'PPP')}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
