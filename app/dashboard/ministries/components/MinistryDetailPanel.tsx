'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Pencil, Plus, Trash2 } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { CampusBadge } from '@/components/CampusBadge'
import { MemberPicker } from '../MemberPicker'
import { MemberRow } from './MemberRow'
import { useIsMobile } from '@/lib/hooks'
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
  const t = useTranslations('ministries')
  const isMobile = useIsMobile()

  if (!ministry) {
    return (
      <Card className="border border-black dark:border-white !ring-0 outline-none">
        <div className={`flex flex-col items-center justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <Users className={`text-muted-foreground mb-4 opacity-50 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`} />
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>{t('selectMinistryDescription')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden border border-black dark:border-white !gap-0 !ring-0 outline-none">
      {/* Ministry Header */}
      <div className={`border-b border-black/20 dark:border-white/20 ${isMobile ? 'px-3 pt-2 pb-2' : 'px-6 pt-2 pb-3'}`}>
        <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
          <div
            className={`rounded-full flex-shrink-0 ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
            style={{ backgroundColor: ministry.color }}
          />
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold flex items-center gap-2 flex-wrap ${isMobile ? 'text-base' : 'text-xl'}`}>
              {ministry.name}
              {ministry.campus && (
                <CampusBadge name={ministry.campus.name} color={ministry.campus.color} size="sm" />
              )}
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={isMobile ? 'h-6 w-6' : 'h-7 w-7'}
                  onClick={(e) => onEditMinistry(ministry, e)}
                >
                  <Pencil className={isMobile ? 'w-3 h-3' : 'w-3 h-3'} />
                </Button>
              )}
            </h2>
            {ministry.description && !isMobile && (
              <p className="text-sm text-muted-foreground">{ministry.description}</p>
            )}
            {ministry.leader && (
              <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm mt-1'}`}>
                {t('ledBy')} <span className="font-medium text-foreground">
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
          <LoadingState message={t('loadingDetails')} size="sm" />
        </div>
      ) : (
        <Tabs defaultValue="roles" className="flex-1 flex flex-col overflow-hidden !gap-0">
          <div className={`py-0 pt-0 pb-0 mt-0 border-b border-black/20 dark:border-white/20 ${isMobile ? 'px-3' : 'px-6'}`}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles" className={`data-[state=active]:bg-brand data-[state=active]:!text-brand-foreground ${isMobile ? 'text-sm' : ''}`}>
                {t('tabs.rolesCount', { count: roles.length })}
              </TabsTrigger>
              <TabsTrigger value="members" className={`data-[state=active]:bg-brand data-[state=active]:!text-brand-foreground ${isMobile ? 'text-sm' : ''}`}>
                {t('tabs.membersCount', { count: members.length })}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="roles" className={`flex-1 overflow-y-auto mt-0 ${isMobile ? 'px-3 pt-3 pb-3' : 'px-6 pt-4 pb-6'}`}>
            <div className={`flex justify-end ${isMobile ? 'mb-2' : 'mb-4'}`}>
              {canManage && (
                <Button variant="outline-pill" className="!border !border-black/20 dark:!border-white/20" size="sm" onClick={onAddRole}>
                  <Plus className={isMobile ? 'w-3.5 h-3.5 mr-1' : 'w-4 h-4 mr-1'} />
                  {t('roles.addRole')}
                </Button>
              )}
            </div>
            {roles.length === 0 ? (
              <div className={`text-center text-muted-foreground ${isMobile ? 'py-6' : 'py-8'}`}>
                <Users className={`mx-auto mb-2 opacity-50 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
                <p className={isMobile ? 'text-xs' : 'text-sm'}>{t('roles.noRoles')}</p>
              </div>
            ) : (
              <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between rounded-lg border border-black/20 dark:border-white/20 ${isMobile ? 'p-2' : 'p-3'}`}
                  >
                    <div>
                      <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{role.name}</p>
                      {role.description && !isMobile && (
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={isMobile ? 'h-7 w-7' : 'h-8 w-8'}
                          onClick={() => onEditRole(role)}
                        >
                          <Pencil className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${isMobile ? 'h-7 w-7' : 'h-8 w-8'}`}
                          onClick={() => onDeleteRole(role)}
                        >
                          <Trash2 className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className={`flex-1 overflow-y-auto mt-0 ${isMobile ? 'px-3 pt-3 pb-3' : 'px-6 pt-4 pb-6'}`}>
            <div className={`flex justify-end ${isMobile ? 'mb-2' : 'mb-4'}`}>
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
              <div className={`text-center text-muted-foreground ${isMobile ? 'py-6' : 'py-8'}`}>
                <Users className={`mx-auto mb-2 opacity-50 ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}`} />
                <p className={isMobile ? 'text-xs' : 'text-sm'}>{t('members.noMembers')}</p>
              </div>
            ) : (
              <div className={isMobile ? 'space-y-1.5' : 'space-y-2'}>
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
