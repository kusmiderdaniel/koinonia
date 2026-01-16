// Re-export all people actions from the new modular structure
// This file maintains backwards compatibility with existing imports

export {
  // Role management
  updateMemberRole,

  // Status management (active, departure)
  updateMemberActive,
  updateMemberDeparture,

  // Baptism management
  updateMemberBaptism,

  // Campus management
  updateMemberCampuses,

  // Offline member management
  createOfflineMember,
  deleteOfflineMember,

  // Profile management
  updateMemberProfile,
} from './actions/index'
