// Re-export all profile actions from the new modular structure
// This file maintains backwards compatibility with existing imports

export {
  // Profile CRUD
  getProfile,
  updateProfile,
  type ProfileInput,

  // Avatar management
  uploadAvatar,
  removeAvatar,

  // Authentication
  changePassword,

  // User preferences
  updateNotificationPreferences,
  updateLanguagePreference,
  updateThemePreference,
  type ThemePreference,

  // Account management
  leaveChurch,
  deleteAccount,

  // GDPR compliance
  getDataExportStatus,
  requestDataExport,
  getAccountDeletionStatus,
  requestAccountDeletion,
  cancelAccountDeletion,
} from './actions/index'
