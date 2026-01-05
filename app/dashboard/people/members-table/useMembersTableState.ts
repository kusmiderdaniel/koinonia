import { useState, useCallback } from 'react'
import { updateMemberRole, updateMemberActive, updateMemberDeparture, updateMemberBaptism } from '../actions'
import type { AssignableRole } from './types'

export function useMembersTableState() {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null)
  const [updatingDepartureId, setUpdatingDepartureId] = useState<string | null>(null)
  const [updatingBaptismId, setUpdatingBaptismId] = useState<string | null>(null)

  const handleRoleChange = useCallback(async (memberId: string, newRole: AssignableRole) => {
    setUpdatingId(memberId)
    try {
      const result = await updateMemberRole(memberId, newRole)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleActiveChange = useCallback(async (memberId: string, active: boolean) => {
    setUpdatingActiveId(memberId)
    try {
      const result = await updateMemberActive(memberId, active)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingActiveId(null)
    }
  }, [])

  const handleDepartureChange = useCallback(async (
    memberId: string,
    dateOfDeparture: string | null,
    reasonForDeparture: string | null
  ) => {
    setUpdatingDepartureId(memberId)
    try {
      const result = await updateMemberDeparture(memberId, dateOfDeparture, reasonForDeparture)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingDepartureId(null)
    }
  }, [])

  const handleBaptismChange = useCallback(async (
    memberId: string,
    baptism: boolean,
    baptismDate: string | null
  ) => {
    setUpdatingBaptismId(memberId)
    try {
      const result = await updateMemberBaptism(memberId, baptism, baptismDate)
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      setUpdatingBaptismId(null)
    }
  }, [])

  return {
    // Update states
    updatingId,
    updatingActiveId,
    updatingDepartureId,
    updatingBaptismId,

    // Handlers
    handleRoleChange,
    handleActiveChange,
    handleDepartureChange,
    handleBaptismChange,
  }
}
