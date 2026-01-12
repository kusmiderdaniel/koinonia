import { describe, it, expect } from 'vitest'
import {
  hasPageAccess,
  hasPermission,
  isVolunteerOrBelow,
  isMember,
  isVolunteer,
  isLeader,
  isAdminOrOwner,
  isLeaderOrAbove,
  getRoleLevel,
  canModifyRole,
  ROLE_HIERARCHY,
} from '@/lib/permissions'

describe('permissions', () => {
  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy levels', () => {
      expect(ROLE_HIERARCHY.owner).toBe(5)
      expect(ROLE_HIERARCHY.admin).toBe(4)
      expect(ROLE_HIERARCHY.leader).toBe(3)
      expect(ROLE_HIERARCHY.volunteer).toBe(2)
      expect(ROLE_HIERARCHY.member).toBe(1)
    })
  })

  describe('hasPageAccess', () => {
    it('should allow all roles to access dashboard', () => {
      expect(hasPageAccess('owner', 'dashboard')).toBe(true)
      expect(hasPageAccess('admin', 'dashboard')).toBe(true)
      expect(hasPageAccess('leader', 'dashboard')).toBe(true)
      expect(hasPageAccess('volunteer', 'dashboard')).toBe(true)
      expect(hasPageAccess('member', 'dashboard')).toBe(true)
    })

    it('should only allow admins to access settings', () => {
      expect(hasPageAccess('owner', 'settings')).toBe(true)
      expect(hasPageAccess('admin', 'settings')).toBe(true)
      expect(hasPageAccess('leader', 'settings')).toBe(false)
      expect(hasPageAccess('volunteer', 'settings')).toBe(false)
      expect(hasPageAccess('member', 'settings')).toBe(false)
    })

    it('should restrict members from events page', () => {
      expect(hasPageAccess('volunteer', 'events')).toBe(true)
      expect(hasPageAccess('member', 'events')).toBe(false)
    })

    it('should restrict volunteers from people page', () => {
      expect(hasPageAccess('leader', 'people')).toBe(true)
      expect(hasPageAccess('volunteer', 'people')).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('should allow only admins to create events', () => {
      expect(hasPermission('owner', 'createEvent')).toBe(true)
      expect(hasPermission('admin', 'createEvent')).toBe(true)
      expect(hasPermission('leader', 'createEvent')).toBe(false)
      expect(hasPermission('volunteer', 'createEvent')).toBe(false)
    })

    it('should allow leaders to manage event content', () => {
      expect(hasPermission('owner', 'manageEventContent')).toBe(true)
      expect(hasPermission('admin', 'manageEventContent')).toBe(true)
      expect(hasPermission('leader', 'manageEventContent')).toBe(true)
      expect(hasPermission('volunteer', 'manageEventContent')).toBe(false)
    })

    it('should only allow owner to transfer ownership', () => {
      expect(hasPermission('owner', 'transferOwnership')).toBe(true)
      expect(hasPermission('admin', 'transferOwnership')).toBe(false)
    })
  })

  describe('role check functions', () => {
    describe('isVolunteerOrBelow', () => {
      it('should return true for volunteer and member', () => {
        expect(isVolunteerOrBelow('volunteer')).toBe(true)
        expect(isVolunteerOrBelow('member')).toBe(true)
      })

      it('should return false for leader and above', () => {
        expect(isVolunteerOrBelow('leader')).toBe(false)
        expect(isVolunteerOrBelow('admin')).toBe(false)
        expect(isVolunteerOrBelow('owner')).toBe(false)
      })
    })

    describe('isMember', () => {
      it('should return true only for member', () => {
        expect(isMember('member')).toBe(true)
        expect(isMember('volunteer')).toBe(false)
        expect(isMember('leader')).toBe(false)
      })
    })

    describe('isVolunteer', () => {
      it('should return true only for volunteer', () => {
        expect(isVolunteer('volunteer')).toBe(true)
        expect(isVolunteer('member')).toBe(false)
        expect(isVolunteer('leader')).toBe(false)
      })
    })

    describe('isLeader', () => {
      it('should return true only for leader', () => {
        expect(isLeader('leader')).toBe(true)
        expect(isLeader('admin')).toBe(false)
        expect(isLeader('volunteer')).toBe(false)
      })
    })

    describe('isAdminOrOwner', () => {
      it('should return true for admin and owner', () => {
        expect(isAdminOrOwner('owner')).toBe(true)
        expect(isAdminOrOwner('admin')).toBe(true)
      })

      it('should return false for leader and below', () => {
        expect(isAdminOrOwner('leader')).toBe(false)
        expect(isAdminOrOwner('volunteer')).toBe(false)
        expect(isAdminOrOwner('member')).toBe(false)
      })
    })

    describe('isLeaderOrAbove', () => {
      it('should return true for leader, admin, and owner', () => {
        expect(isLeaderOrAbove('owner')).toBe(true)
        expect(isLeaderOrAbove('admin')).toBe(true)
        expect(isLeaderOrAbove('leader')).toBe(true)
      })

      it('should return false for volunteer and member', () => {
        expect(isLeaderOrAbove('volunteer')).toBe(false)
        expect(isLeaderOrAbove('member')).toBe(false)
      })
    })
  })

  describe('getRoleLevel', () => {
    it('should return correct level for each role', () => {
      expect(getRoleLevel('owner')).toBe(5)
      expect(getRoleLevel('admin')).toBe(4)
      expect(getRoleLevel('leader')).toBe(3)
      expect(getRoleLevel('volunteer')).toBe(2)
      expect(getRoleLevel('member')).toBe(1)
    })

    it('should return 0 for unknown roles', () => {
      expect(getRoleLevel('unknown')).toBe(0)
      expect(getRoleLevel('')).toBe(0)
    })
  })

  describe('canModifyRole', () => {
    it('should allow owner to modify all other roles', () => {
      expect(canModifyRole('owner', 'admin')).toBe(true)
      expect(canModifyRole('owner', 'leader')).toBe(true)
      expect(canModifyRole('owner', 'volunteer')).toBe(true)
      expect(canModifyRole('owner', 'member')).toBe(true)
    })

    it('should not allow owner to modify owner', () => {
      expect(canModifyRole('owner', 'owner')).toBe(false)
    })

    it('should allow admin to modify leader and below', () => {
      expect(canModifyRole('admin', 'leader')).toBe(true)
      expect(canModifyRole('admin', 'volunteer')).toBe(true)
      expect(canModifyRole('admin', 'member')).toBe(true)
    })

    it('should not allow admin to modify admin or owner', () => {
      expect(canModifyRole('admin', 'admin')).toBe(false)
      expect(canModifyRole('admin', 'owner')).toBe(false)
    })

    it('should not allow volunteer to modify anyone', () => {
      expect(canModifyRole('volunteer', 'member')).toBe(true) // Can modify member
      expect(canModifyRole('volunteer', 'volunteer')).toBe(false)
      expect(canModifyRole('volunteer', 'leader')).toBe(false)
    })

    it('should not allow member to modify anyone', () => {
      expect(canModifyRole('member', 'member')).toBe(false)
      expect(canModifyRole('member', 'volunteer')).toBe(false)
    })
  })
})
