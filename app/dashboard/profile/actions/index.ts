// Profile actions - split into logical modules for maintainability

// Profile CRUD
export { getProfile, updateProfile, type ProfileInput } from './profile'

// Avatar management
export { uploadAvatar, removeAvatar } from './avatar'

// Authentication
export { changePassword } from './auth'

// User preferences
export {
  updateNotificationPreferences,
  updateLanguagePreference,
  updateThemePreference,
  type ThemePreference,
} from './preferences'

// Account management
export { leaveChurch, deleteAccount } from './account'

// GDPR compliance
export {
  getDataExportStatus,
  requestDataExport,
  getAccountDeletionStatus,
  requestAccountDeletion,
  cancelAccountDeletion,
} from './gdpr'
