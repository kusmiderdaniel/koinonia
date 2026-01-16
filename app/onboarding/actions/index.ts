// Onboarding actions - split into logical modules for maintainability

// Validation
export { checkSubdomainAvailability } from './validation'

// Church creation
export { createChurch } from './church-creation'

// Church joining
export { joinChurch, getCampusesByJoinCode } from './church-joining'

// Profile checks
export { checkUserProfile } from './profile'
