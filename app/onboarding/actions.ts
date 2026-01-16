// Re-export all onboarding actions from the new modular structure
// This file maintains backwards compatibility with existing imports

export {
  // Validation
  checkSubdomainAvailability,

  // Church creation
  createChurch,

  // Church joining
  joinChurch,
  getCampusesByJoinCode,

  // Profile checks
  checkUserProfile,
} from './actions/index'
