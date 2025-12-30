'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Pencil, Plus, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { MemberPicker } from '../member-picker'
import { MemberRow } from './MemberRow'
import type { Ministry, Role, MinistryMember } from '../types'

interface ChurchMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
}

interface MinistryInfo {
  id: string
  name: string
  members: {
    profile_id: string
    role_names: string[]
  }[]
}

interface MinistryDetailPanelProps {
  ministry: Ministry | null | undefined
  roles: Role[]
  members: MinistryMember[]
  availableMembers: ChurchMember[]
  allMinistries: MinistryInfo[]
  isLoading: boolean
  canManage: boolean
  isAddingMember: boolean
  onEditMinistry: (ministry: Ministry, e: React.MouseEvent) => void
  onAddRole: () => void
  onEditRole: (role: Role) => void
  onDeleteRole: (role: Role) => void
  onAddMember: (memberId: string, roleIds: string[]) => Promise<void>
  onUpdateMemberRoles: (memberId: string, roleIds: string[]) => void
  onRemoveMember: (member: MinistryMember) => void
}

export function MinistryDetailPanel({
  ministry,
  roles,
  members,
  availableMembers,
  allMinistries,
  isLoading,
  canManage,
  isAddingMember,
  onEditMinistry,
  onAddRole,
  onEditRole,
  onDeleteRole,
  onAddMember,
  onUpdateMemberRoles,
  onRemoveMember,
}: MinistryDetailPanelProps) {
  if (!ministry) {
    return (
      <Card className="border border-black dark:border-zinc-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Select a ministry to view details</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-black dark:border-zinc-700">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: ministry.color }}
          />
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {ministry.name}
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => onEditMinistry(ministry, e)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
            </CardTitle>
            {ministry.description && (
              <CardDescription>{ministry.description}</CardDescription>
            )}
          </div>
        </div>
        {ministry.leader && (
          <p className="text-sm text-muted-foreground mt-2">
            Led by <span className="font-medium text-foreground">
              {ministry.leader.first_name} {ministry.leader.last_name}
            </span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading details..." size="sm" />
        ) : (
          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 border border-black dark:border-zinc-700">
              <TabsTrigger value="roles" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                Roles ({roles.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                Members ({members.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles">
              <div className="space-y-4">
                {canManage && (
                  <div className="flex justify-end">
                    <Button variant="ghost" className="rounded-full !border !border-gray-300 dark:!border-gray-600" size="sm" onClick={onAddRole}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Role
                    </Button>
                  </div>
                )}
                {roles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <p>No roles defined yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{role.name}</p>
                          {role.description && (
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEditRole(role)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onDeleteRole(role)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members">
              <div className="space-y-4">
                {canManage && (
                  <div className="flex justify-end">
                    <MemberPicker
                      availableMembers={availableMembers}
                      ministryRoles={roles}
                      allMinistries={allMinistries}
                      currentMinistryId={ministry.id}
                      onAdd={onAddMember}
                      isAdding={isAddingMember}
                    />
                  </div>
                )}
                {members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No members assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        allRoles={roles}
                        canManage={canManage}
                        onUpdateRoles={(roleIds) => onUpdateMemberRoles(member.id, roleIds)}
                        onRemove={() => onRemoveMember(member)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
