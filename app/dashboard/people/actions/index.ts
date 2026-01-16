// People actions - split into logical modules for maintainability

// Role management
export { updateMemberRole } from './role'

// Status management (active, departure)
export { updateMemberActive, updateMemberDeparture } from './status'

// Baptism management
export { updateMemberBaptism } from './baptism'

// Campus management
export { updateMemberCampuses } from './campus'

// Offline member management
export { createOfflineMember, deleteOfflineMember } from './offline'

// Profile management
export { updateMemberProfile } from './profile'
