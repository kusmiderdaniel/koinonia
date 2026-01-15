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
  Heart,
  FileText,
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
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
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
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          {selectedChurch && (
            <>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-background p-6 border-b">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                    <AvatarImage src={selectedChurch.church.logo_url || undefined} />
                    <AvatarFallback className="bg-brand/10">
                      <Church className="h-8 w-8 text-brand" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">{selectedChurch.church.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedChurch.church.subdomain}.koinonia.app
                    </p>
                    {(selectedChurch.church.city || selectedChurch.church.country) && (
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {[selectedChurch.church.city, selectedChurch.church.country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 mt-5">
                  <div className="bg-background/80 backdrop-blur rounded-xl px-2 py-4 text-center border shadow-sm">
                    <Users className="h-4 w-4 mx-auto text-blue-500 mb-1.5" />
                    <div className="text-2xl font-bold">{selectedChurch.church.member_count}</div>
                    <div className="text-xs text-muted-foreground mt-1">Members</div>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-xl px-2 py-4 text-center border shadow-sm">
                    <Calendar className="h-4 w-4 mx-auto text-green-500 mb-1.5" />
                    <div className="text-2xl font-bold">{selectedChurch.stats.totalEvents}</div>
                    <div className="text-xs text-muted-foreground mt-1">Events</div>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-xl px-2 py-4 text-center border shadow-sm">
                    <Heart className="h-4 w-4 mx-auto text-purple-500 mb-1.5" />
                    <div className="text-2xl font-bold">{selectedChurch.stats.totalMinistries}</div>
                    <div className="text-xs text-muted-foreground mt-1">Ministries</div>
                  </div>
                  <div className="bg-background/80 backdrop-blur rounded-xl px-2 py-4 text-center border shadow-sm">
                    <FileText className="h-4 w-4 mx-auto text-orange-500 mb-1.5" />
                    <div className="text-2xl font-bold">{selectedChurch.stats.totalForms}</div>
                    <div className="text-xs text-muted-foreground mt-1">Forms</div>
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[50vh]">
                <div className="p-6 space-y-6">
                  {/* Contact Info */}
                  {(selectedChurch.church.email || selectedChurch.church.phone || selectedChurch.church.website) && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Contact
                      </h3>
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                        {selectedChurch.church.email && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="text-sm">{selectedChurch.church.email}</span>
                          </div>
                        )}
                        {selectedChurch.church.phone && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                              <Phone className="h-4 w-4 text-green-500" />
                            </div>
                            <span className="text-sm">{selectedChurch.church.phone}</span>
                          </div>
                        )}
                        {selectedChurch.church.website && (
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Globe className="h-4 w-4 text-purple-500" />
                            </div>
                            <a
                              href={selectedChurch.church.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-brand hover:underline flex items-center gap-1"
                            >
                              {selectedChurch.church.website}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Members ({selectedChurch.members.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedChurch.members.slice(0, 10).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-brand/10 text-brand">
                                {member.first_name[0]}{member.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {member.first_name} {member.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                          <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                      {selectedChurch.members.length > 10 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-muted-foreground">
                            +{selectedChurch.members.length - 10} more members
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="border-t bg-muted/20 px-6 py-3 flex justify-between text-xs text-muted-foreground">
                <span>Created {format(new Date(selectedChurch.church.created_at), 'MMM d, yyyy')}</span>
                <span>Updated {format(new Date(selectedChurch.church.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
