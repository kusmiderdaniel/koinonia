'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Link2, Loader2, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { CampusBadge } from '@/components/CampusBadge'
import {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  linkRegistrationToProfile,
  getOfflineMembers,
} from './actions'

interface CampusInfo {
  id: string
  name: string
  color: string
}

interface PendingRegistration {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  status: string
  created_at: string
  campus_id: string | null
  campus: CampusInfo | null
}

interface OfflineMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  date_of_birth: string | null
}

export default function PendingRegistrationsPage() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([])
  const [offlineMembers, setOfflineMembers] = useState<OfflineMember[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [memberSearch, setMemberSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const regResult = await getPendingRegistrations()

    if (regResult.data) {
      setRegistrations(regResult.data)
    }
    if (regResult.isAdmin !== undefined) {
      setIsAdmin(regResult.isAdmin)
    }

    // Only fetch offline members for admins (for linking)
    if (regResult.isAdmin) {
      const membersResult = await getOfflineMembers()
      if (membersResult.data) {
        setOfflineMembers(membersResult.data)
      }
    }
    setLoading(false)
  }

  async function handleApprove(registration: PendingRegistration) {
    setActionLoading(registration.id)
    const result = await approveRegistration(registration.id)
    setActionLoading(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${registration.first_name} ${registration.last_name} has been approved`)
      setRegistrations(prev => prev.filter(r => r.id !== registration.id))
    }
  }

  function openRejectDialog(registration: PendingRegistration) {
    setSelectedRegistration(registration)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  async function handleReject() {
    if (!selectedRegistration) return

    setActionLoading(selectedRegistration.id)
    const result = await rejectRegistration(selectedRegistration.id, rejectReason || undefined)
    setActionLoading(null)
    setRejectDialogOpen(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Registration rejected`)
      setRegistrations(prev => prev.filter(r => r.id !== selectedRegistration.id))
    }
    setSelectedRegistration(null)
  }

  function openLinkDialog(registration: PendingRegistration) {
    setSelectedRegistration(registration)
    setSelectedProfileId('')
    setMemberSearch('')
    setLinkDialogOpen(true)
  }

  // Filter offline members based on search
  const filteredOfflineMembers = offlineMembers.filter((member) => {
    if (!memberSearch.trim()) return true
    const searchLower = memberSearch.toLowerCase()
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const email = member.email?.toLowerCase() || ''
    return fullName.includes(searchLower) || email.includes(searchLower)
  })

  async function handleLink() {
    if (!selectedRegistration || !selectedProfileId) return

    setActionLoading(selectedRegistration.id)
    const result = await linkRegistrationToProfile(selectedRegistration.id, selectedProfileId)
    setActionLoading(null)
    setLinkDialogOpen(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      const member = offlineMembers.find(m => m.id === selectedProfileId)
      toast.success(
        `${selectedRegistration.first_name} ${selectedRegistration.last_name} has been linked to ${member?.first_name} ${member?.last_name}`
      )
      setRegistrations(prev => prev.filter(r => r.id !== selectedRegistration.id))
      setOfflineMembers(prev => prev.filter(m => m.id !== selectedProfileId))
    }
    setSelectedRegistration(null)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/people">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Pending Registrations</h1>
          <p className="text-muted-foreground">
            Review and approve new member registrations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Awaiting Approval
          </CardTitle>
          <CardDescription>
            {registrations.length} registration{registrations.length !== 1 ? 's' : ''} pending review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending registrations</p>
              <p className="text-sm">New signups will appear here for approval</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.first_name} {registration.last_name}
                    </TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>
                      {registration.campus ? (
                        <CampusBadge
                          name={registration.campus.name}
                          color={registration.campus.color}
                          size="sm"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(registration.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && offlineMembers.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLinkDialog(registration)}
                            disabled={actionLoading === registration.id}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => openRejectDialog(registration)}
                          disabled={actionLoading === registration.id}
                          className="!bg-red-600 hover:!bg-red-700 !text-white"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(registration)}
                          disabled={actionLoading === registration.id}
                          className="!bg-green-600 hover:!bg-green-700 !text-white !border-green-600"
                        >
                          {actionLoading === registration.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedRegistration?.first_name} {selectedRegistration?.last_name}&apos;s registration?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="!border !border-gray-300" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="!bg-red-600 hover:!bg-red-700 !text-white !border !border-red-600" onClick={handleReject}>
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link to Existing Member</DialogTitle>
            <DialogDescription>
              Link {selectedRegistration?.first_name} {selectedRegistration?.last_name}&apos;s account to an existing offline member record.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 !border !border-gray-300"
              />
            </div>
            <ScrollArea className="h-[200px] !border !border-gray-300 rounded-md">
              {filteredOfflineMembers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {memberSearch ? 'No members match your search' : 'No offline members available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredOfflineMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedProfileId(member.id)}
                      className={`w-full text-left px-3 py-3 text-sm transition-colors ${
                        selectedProfileId === member.id
                          ? 'bg-brand/10 text-brand'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                      {member.email && (
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" className="!border !border-gray-300" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={!selectedProfileId} className="!bg-brand hover:!bg-brand/90 !text-white !border !border-brand">
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
