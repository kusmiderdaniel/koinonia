'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getMinistryDetails,
  createMinistryRole,
  updateMinistryRole,
  deleteMinistryRole,
  addMinistryMember,
  updateMinistryMemberRoles,
  removeMinistryMember,
} from '../actions'
import type { Role, MinistryMember, ChurchMember, MinistryInfo } from '../types'

interface UseMinistryDetailReturn {
  // Data
  roles: Role[]
  members: MinistryMember[]
  churchMembers: ChurchMember[]
  allMinistries: MinistryInfo[]
  availableMembers: ChurchMember[]

  // State
  isLoadingDetail: boolean

  // Actions
  loadMinistryDetails: (ministryId: string) => Promise<void>

  // Role actions
  saveRole: (
    ministryId: string,
    editingRole: Role | null,
    name: string,
    description: string
  ) => Promise<{ error?: string }>
  deleteRole: (roleId: string, ministryId: string) => Promise<{ error?: string }>

  // Member actions
  addMember: (
    ministryId: string,
    memberId: string,
    roleIds: string[]
  ) => Promise<{ error?: string }>
  updateMemberRoles: (
    memberId: string,
    roleIds: string[],
    ministryId: string
  ) => Promise<{ error?: string }>
  removeMember: (
    membershipId: string,
    ministryId: string
  ) => Promise<{ error?: string }>
}

export function useMinistryDetail(): UseMinistryDetailReturn {
  const [roles, setRoles] = useState<Role[]>([])
  const [members, setMembers] = useState<MinistryMember[]>([])
  const [churchMembers, setChurchMembers] = useState<ChurchMember[]>([])
  const [allMinistries, setAllMinistries] = useState<MinistryInfo[]>([])
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const loadMinistryDetails = useCallback(async (ministryId: string) => {
    setIsLoadingDetail(true)
    const result = await getMinistryDetails(ministryId)

    if (result.data) {
      setRoles(result.data.roles)
      setMembers(result.data.members)
      setChurchMembers(result.data.churchMembers)
      setAllMinistries(result.data.allMinistries)
    }
    setIsLoadingDetail(false)
  }, [])

  // Get available members (not already in this ministry)
  const availableMembers = useMemo(
    () => churchMembers.filter((cm) => !members.some((m) => m.profile_id === cm.id)),
    [churchMembers, members]
  )

  // Role actions
  const saveRole = useCallback(
    async (
      ministryId: string,
      editingRole: Role | null,
      name: string,
      description: string
    ) => {
      const data = { name: name.trim(), description: description.trim() || undefined }

      const result = editingRole
        ? await updateMinistryRole(editingRole.id, data)
        : await createMinistryRole(ministryId, data)

      if (!result.error) {
        await loadMinistryDetails(ministryId)
      }
      return result
    },
    [loadMinistryDetails]
  )

  const deleteRole = useCallback(
    async (roleId: string, ministryId: string) => {
      const result = await deleteMinistryRole(roleId)
      if (!result.error) {
        await loadMinistryDetails(ministryId)
      }
      return result
    },
    [loadMinistryDetails]
  )

  // Member actions
  const addMember = useCallback(
    async (ministryId: string, memberId: string, roleIds: string[]) => {
      const result = await addMinistryMember(ministryId, memberId, roleIds)
      if (!result.error) {
        await loadMinistryDetails(ministryId)
      }
      return result
    },
    [loadMinistryDetails]
  )

  const updateMemberRoles = useCallback(
    async (memberId: string, roleIds: string[], ministryId: string) => {
      const result = await updateMinistryMemberRoles(memberId, roleIds)
      if (!result.error) {
        await loadMinistryDetails(ministryId)
      }
      return result
    },
    [loadMinistryDetails]
  )

  const removeMember = useCallback(
    async (membershipId: string, ministryId: string) => {
      const result = await removeMinistryMember(membershipId)
      if (!result.error) {
        await loadMinistryDetails(ministryId)
      }
      return result
    },
    [loadMinistryDetails]
  )

  return {
    // Data
    roles,
    members,
    churchMembers,
    allMinistries,
    availableMembers,

    // State
    isLoadingDetail,

    // Actions
    loadMinistryDetails,

    // Role actions
    saveRole,
    deleteRole,

    // Member actions
    addMember,
    updateMemberRoles,
    removeMember,
  }
}
