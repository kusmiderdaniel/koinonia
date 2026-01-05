'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Pencil, Plus, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { CampusBadge } from '@/components/CampusBadge'
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
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">Select a ministry to view details</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-zinc-700 !gap-0">
      {/* Ministry Header */}
      <div className="px-6 pt-2 pb-3 border-b">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: ministry.color }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
              {ministry.name}
              {ministry.campus && (
                <CampusBadge name={ministry.campus.name} color={ministry.campus.color} size="sm" />
              )}
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
            </h2>
            {ministry.description && (
              <p className="text-sm text-muted-foreground">{ministry.description}</p>
            )}
            {ministry.leader && (
              <p className="text-sm text-muted-foreground mt-1">
                Led by <span className="font-medium text-foreground">
                  {ministry.leader.first_name} {ministry.leader.last_name}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingState message="Loading details..." size="sm" />
        </div>
      ) : (
        <Tabs defaultValue="roles" className="flex-1 flex flex-col overflow-hidden !gap-0">
          <div className="px-6 py-0 pt-0 pb-0 mt-0 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                Roles ({roles.length})
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-brand data-[state=active]:text-brand-foreground">
                Members ({members.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="roles" className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0">
            <div className="flex justify-end mb-4">
              {canManage && (
                <Button variant="outline-pill" className="!border !border-black dark:!border-white" size="sm" onClick={onAddRole}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Role
                </Button>
              )}
            </div>
            {roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No roles defined yet</p>
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
          </TabsContent>

          <TabsContent value="members" className="flex-1 overflow-y-auto px-6 pt-4 pb-6 mt-0">
            <div className="flex justify-end mb-4">
              {canManage && (
                <MemberPicker
                  availableMembers={availableMembers}
                  ministryRoles={roles}
                  allMinistries={allMinistries}
                  currentMinistryId={ministry.id}
                  onAdd={onAddMember}
                  isAdding={isAddingMember}
                />
              )}
            </div>
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No members assigned yet</p>
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
          </TabsContent>
        </Tabs>
      )}
    </Card>
  )
}
