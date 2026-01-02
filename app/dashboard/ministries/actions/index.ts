// Re-export all actions from modular files

// Ministry CRUD
export {
  getMinistries,
  createMinistry,
  updateMinistry,
  deleteMinistry,
  getChurchLeaders,
} from './ministry-crud'

// Roles
export {
  getMinistryRoles,
  createMinistryRole,
  updateMinistryRole,
  deleteMinistryRole,
} from './roles'

// Members
export {
  getMinistryMembers,
  addMinistryMember,
  updateMinistryMemberRoles,
  removeMinistryMember,
  getChurchMembers,
} from './members'

// Combined Queries
export {
  getAllMinistriesWithMembers,
  getMinistryDetails,
  getCampuses,
} from './queries'

// Types
export type { MinistryInput, RoleInput } from './helpers'
