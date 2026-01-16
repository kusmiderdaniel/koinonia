/**
 * Centralized error messages for the application.
 *
 * These constants ensure consistency across the codebase and make it easier to:
 * - Update error messaging in one place
 * - Support internationalization in the future
 * - Maintain consistent error handling patterns
 *
 * Usage:
 * ```ts
 * import { AUTH_ERRORS, CRUD_ERRORS } from '@/lib/constants/error-messages'
 *
 * if (!user) {
 *   return { error: AUTH_ERRORS.NOT_AUTHENTICATED }
 * }
 * ```
 */

// ============================================================================
// Authentication & Authorization Errors
// ============================================================================

export const AUTH_ERRORS = {
  NOT_AUTHENTICATED: 'Not authenticated',
  NOT_AUTHORIZED: 'Not authorized',
  SESSION_EXPIRED: 'Session expired',
  INVALID_CREDENTIALS: 'Invalid credentials',
  GOOGLE_SIGN_IN_FAILED: 'googleSignInFailed',
  PROFILE_NOT_FOUND: 'Profile not found',
  USER_NOT_FOUND: 'User not found',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
} as const

// ============================================================================
// Generic CRUD Errors
// ============================================================================

export const CRUD_ERRORS = {
  NOT_FOUND: 'Not found',
  FAILED_TO_CREATE: 'Failed to create',
  FAILED_TO_UPDATE: 'Failed to update',
  FAILED_TO_DELETE: 'Failed to delete',
  FAILED_TO_LOAD: 'Failed to load',
  FAILED_TO_SAVE: 'Failed to save',
  ALREADY_EXISTS: 'Already exists',
  INVALID_DATA: 'Invalid data provided',
} as const

// ============================================================================
// Form Errors
// ============================================================================

export const FORM_ERRORS = {
  NOT_FOUND: 'Form not found',
  FAILED_TO_CREATE: 'Failed to create form',
  FAILED_TO_UPDATE: 'Failed to update form',
  FAILED_TO_DELETE: 'Failed to delete form',
  FAILED_TO_LOAD: 'Failed to load form',
  FAILED_TO_SUBMIT: 'Failed to submit form',
  NOT_ACCEPTING_RESPONSES: 'This form is not accepting responses',
  FIELD_NOT_FOUND: 'Field not found',
  FAILED_TO_CREATE_FIELD: 'Failed to create field',
  FAILED_TO_UPDATE_FIELD: 'Failed to update field',
  FAILED_TO_DELETE_FIELD: 'Failed to delete field',
  FAILED_TO_REORDER_FIELDS: 'Failed to reorder fields',
  CONDITION_NOT_FOUND: 'Condition not found',
  FAILED_TO_CREATE_CONDITION: 'Failed to create condition',
  FAILED_TO_UPDATE_CONDITION: 'Failed to update condition',
  FAILED_TO_DELETE_CONDITION: 'Failed to delete condition',
  SUBMISSION_NOT_FOUND: 'Submission not found',
  FAILED_TO_LOAD_SUBMISSIONS: 'Failed to load submissions',
  FAILED_TO_EXPORT: 'Failed to export form data',
  INVALID_TOKEN: 'Invalid token',
  FAILED_TO_RECORD_EVENT: 'Failed to record event',
} as const

// ============================================================================
// People/Member Errors
// ============================================================================

export const PEOPLE_ERRORS = {
  MEMBER_NOT_FOUND: 'Member not found',
  FAILED_TO_LOAD: 'Failed to load members',
  FAILED_TO_UPDATE: 'Failed to update member',
  FAILED_TO_DELETE: 'Failed to delete member',
  FAILED_TO_CREATE: 'Failed to create member',
  FAILED_TO_UPDATE_ROLE: 'Failed to update role',
  FAILED_TO_UPDATE_STATUS: 'Failed to update active status',
  FAILED_TO_UPDATE_PROFILE: 'Failed to update profile',
  FAILED_TO_UPDATE_FIELD: 'Failed to update field value',
  EMAIL_ALREADY_EXISTS: 'A member with this email already exists',
  INVALID_ROLE: 'Invalid role specified',
  CANNOT_CHANGE_OWN_ROLE: 'You cannot change your own role',
  CANNOT_CHANGE_HIGHER_ROLE: 'You cannot change the role of someone with equal or higher access',
  FIELD_NOT_FOUND: 'Custom field not found',
  FAILED_TO_CREATE_FIELD: 'Failed to create custom field',
  FAILED_TO_UPDATE_FIELD_DEFINITION: 'Failed to update custom field',
  FAILED_TO_DELETE_FIELD: 'Failed to delete custom field',
} as const

// ============================================================================
// Ministry Errors
// ============================================================================

export const MINISTRY_ERRORS = {
  NOT_FOUND: 'Ministry not found',
  FAILED_TO_LOAD: 'Failed to load ministries',
  FAILED_TO_CREATE: 'Failed to create ministry',
  FAILED_TO_UPDATE: 'Failed to update ministry',
  FAILED_TO_DELETE: 'Failed to delete ministry',
  NAME_ALREADY_EXISTS: 'A ministry with this name already exists',
  LEADER_REQUIRED: 'A ministry leader must be assigned',
  PERMISSION_DENIED: 'You do not have permission to edit this ministry',
  SYSTEM_MINISTRY_DELETE: 'System ministries cannot be deleted. You can modify its roles and members instead.',
  MEMBER_ALREADY_EXISTS: 'This person is already a member of this ministry',
  MEMBER_NOT_FOUND: 'Member not found',
  FAILED_TO_ADD_MEMBER: 'Failed to add member',
  FAILED_TO_REMOVE_MEMBER: 'Failed to remove member',
  FAILED_TO_UPDATE_ROLES: 'Failed to update roles',
  ROLE_NOT_FOUND: 'Role not found',
  ROLE_NAME_EXISTS: 'A role with this name already exists in this ministry',
  FAILED_TO_CREATE_ROLE: 'Failed to create role',
  FAILED_TO_UPDATE_ROLE: 'Failed to update role',
  FAILED_TO_DELETE_ROLE: 'Failed to delete role',
} as const

// ============================================================================
// Event Errors
// ============================================================================

export const EVENT_ERRORS = {
  NOT_FOUND: 'Event not found',
  FAILED_TO_LOAD: 'Failed to load events',
  FAILED_TO_CREATE: 'Failed to create event',
  FAILED_TO_UPDATE: 'Failed to update event',
  FAILED_TO_DELETE: 'Failed to delete event',
  FAILED_TO_PUBLISH: 'Failed to publish event',
  FAILED_TO_UNPUBLISH: 'Failed to unpublish event',
  FAILED_TO_DUPLICATE: 'Failed to duplicate event',
  POSITION_NOT_FOUND: 'Position not found',
  FAILED_TO_CREATE_POSITION: 'Failed to create position',
  FAILED_TO_UPDATE_POSITION: 'Failed to update position',
  FAILED_TO_DELETE_POSITION: 'Failed to delete position',
  ASSIGNMENT_NOT_FOUND: 'Assignment not found',
  FAILED_TO_ASSIGN: 'Failed to assign volunteer',
  FAILED_TO_UNASSIGN: 'Failed to remove assignment',
  FAILED_TO_CONFIRM: 'Failed to confirm assignment',
  INVITATION_NOT_FOUND: 'Invitation not found',
  FAILED_TO_SEND_INVITATIONS: 'Failed to send invitations',
  FAILED_TO_RESPOND: 'Failed to respond to invitation',
} as const

// ============================================================================
// Task Errors
// ============================================================================

export const TASK_ERRORS = {
  NOT_FOUND: 'Task not found',
  FAILED_TO_LOAD: 'Failed to load tasks',
  FAILED_TO_CREATE: 'Failed to create task',
  FAILED_TO_UPDATE: 'Failed to update task',
  FAILED_TO_DELETE: 'Failed to delete task',
  TITLE_REQUIRED: 'Title is required',
  COMMENT_NOT_FOUND: 'Comment not found',
  FAILED_TO_ADD_COMMENT: 'Failed to add comment',
  FAILED_TO_UPDATE_COMMENT: 'Failed to update comment',
  FAILED_TO_DELETE_COMMENT: 'Failed to delete comment',
} as const

// ============================================================================
// Song Errors
// ============================================================================

export const SONG_ERRORS = {
  NOT_FOUND: 'Song not found',
  FAILED_TO_LOAD: 'Failed to load songs',
  FAILED_TO_CREATE: 'Failed to create song',
  FAILED_TO_UPDATE: 'Failed to update song',
  FAILED_TO_DELETE: 'Failed to delete song',
  ARRANGEMENT_NOT_FOUND: 'Arrangement not found',
  FAILED_TO_CREATE_ARRANGEMENT: 'Failed to create arrangement',
  FAILED_TO_UPDATE_ARRANGEMENT: 'Failed to update arrangement',
  FAILED_TO_DELETE_ARRANGEMENT: 'Failed to delete arrangement',
  SECTION_NOT_FOUND: 'Section not found',
  FAILED_TO_CREATE_SECTION: 'Failed to create section',
  FAILED_TO_UPDATE_SECTION: 'Failed to update section',
  FAILED_TO_DELETE_SECTION: 'Failed to delete section',
  ATTACHMENT_NOT_FOUND: 'Attachment not found',
  FAILED_TO_UPLOAD_ATTACHMENT: 'Failed to upload attachment',
  FAILED_TO_DELETE_ATTACHMENT: 'Failed to delete attachment',
} as const

// ============================================================================
// Settings Errors
// ============================================================================

export const SETTINGS_ERRORS = {
  FAILED_TO_LOAD: 'Failed to load settings',
  FAILED_TO_UPDATE: 'Failed to update settings',
  CHURCH_NOT_FOUND: 'Church not found',
  FAILED_TO_UPDATE_CHURCH: 'Failed to update church settings',
  LOCATION_NOT_FOUND: 'Location not found',
  FAILED_TO_CREATE_LOCATION: 'Failed to create location',
  FAILED_TO_UPDATE_LOCATION: 'Failed to update location',
  FAILED_TO_DELETE_LOCATION: 'Failed to delete location',
  CAMPUS_NOT_FOUND: 'Campus not found',
  FAILED_TO_CREATE_CAMPUS: 'Failed to create campus',
  FAILED_TO_UPDATE_CAMPUS: 'Failed to update campus',
  FAILED_TO_DELETE_CAMPUS: 'Failed to delete campus',
  PRESET_NOT_FOUND: 'Preset not found',
  FAILED_TO_CREATE_PRESET: 'Failed to create preset',
  FAILED_TO_UPDATE_PRESET: 'Failed to update preset',
  FAILED_TO_DELETE_PRESET: 'Failed to delete preset',
} as const

// ============================================================================
// Upload Errors
// ============================================================================

export const UPLOAD_ERRORS = {
  NO_FILE: 'No file provided',
  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  FAILED_TO_UPLOAD: 'Failed to upload file',
  FAILED_TO_DELETE: 'Failed to delete file',
} as const

// ============================================================================
// Notification Errors
// ============================================================================

export const NOTIFICATION_ERRORS = {
  FAILED_TO_LOAD: 'Failed to load notifications',
  FAILED_TO_MARK_READ: 'Failed to mark notification as read',
  FAILED_TO_MARK_ALL_READ: 'Failed to mark all notifications as read',
  PUSH_BLOCKED: 'Notifications blocked. Please enable them in browser settings.',
  FAILED_TO_REGISTER: 'Failed to register for push notifications',
  FAILED_TO_UNREGISTER: 'Failed to unregister push notifications',
} as const

// ============================================================================
// Admin Errors
// ============================================================================

export const ADMIN_ERRORS = {
  NOT_AUTHORIZED: 'Not authorized',
  FAILED_TO_FETCH_USERS: 'Failed to fetch users',
  FAILED_TO_FETCH_CHURCHES: 'Failed to fetch churches',
  USER_NOT_FOUND: 'User not found',
  CHURCH_NOT_FOUND: 'Church not found',
  FAILED_TO_UPDATE_USER: 'Failed to update user',
  FAILED_TO_UPDATE_SUPER_ADMIN: 'Failed to update super admin status',
  FAILED_TO_FETCH_GROWTH_DATA: 'Failed to fetch growth data',
  FAILED_TO_LOAD_DOCUMENTS: 'Failed to load documents',
  FAILED_TO_LOAD_DOCUMENT: 'Failed to load document',
  FAILED_TO_CREATE_DOCUMENT: 'Failed to create document',
  DOCUMENT_NOT_FOUND: 'No published document found',
} as const

// ============================================================================
// Calendar/Availability Errors
// ============================================================================

export const CALENDAR_ERRORS = {
  FAILED_TO_LOAD: 'Failed to load calendar data',
  FAILED_TO_CREATE_UNAVAILABILITY: 'Failed to create unavailability',
  FAILED_TO_UPDATE_UNAVAILABILITY: 'Failed to update unavailability',
  FAILED_TO_DELETE_UNAVAILABILITY: 'Failed to delete unavailability',
  INVALID_DATE_RANGE: 'End date must be on or after start date',
  FAILED_TO_SYNC: 'Failed to sync calendar',
} as const

// ============================================================================
// API/Network Errors
// ============================================================================

export const API_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  INVALID_REQUEST_DATA: 'Invalid request data',
} as const

// ============================================================================
// Generic UI Errors (for toast messages)
// ============================================================================

export const UI_ERRORS = {
  SOMETHING_WENT_WRONG: 'Something went wrong',
  PLEASE_TRY_AGAIN: 'Please try again',
  FAILED_TO_SAVE: 'Failed to save',
  FAILED_TO_LOAD: 'Failed to load',
  FAILED_TO_DELETE: 'Failed to delete',
  FAILED_TO_UPLOAD: 'Failed to upload',
  FAILED_TO_REORDER: 'Failed to reorder',
} as const

// ============================================================================
// Type exports for use with error handling
// ============================================================================

export type AuthError = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS]
export type CrudError = typeof CRUD_ERRORS[keyof typeof CRUD_ERRORS]
export type FormError = typeof FORM_ERRORS[keyof typeof FORM_ERRORS]
export type PeopleError = typeof PEOPLE_ERRORS[keyof typeof PEOPLE_ERRORS]
export type MinistryError = typeof MINISTRY_ERRORS[keyof typeof MINISTRY_ERRORS]
export type EventError = typeof EVENT_ERRORS[keyof typeof EVENT_ERRORS]
export type TaskError = typeof TASK_ERRORS[keyof typeof TASK_ERRORS]
export type SongError = typeof SONG_ERRORS[keyof typeof SONG_ERRORS]
export type SettingsError = typeof SETTINGS_ERRORS[keyof typeof SETTINGS_ERRORS]
export type UploadError = typeof UPLOAD_ERRORS[keyof typeof UPLOAD_ERRORS]
export type NotificationError = typeof NOTIFICATION_ERRORS[keyof typeof NOTIFICATION_ERRORS]
export type AdminError = typeof ADMIN_ERRORS[keyof typeof ADMIN_ERRORS]
export type CalendarError = typeof CALENDAR_ERRORS[keyof typeof CALENDAR_ERRORS]
export type ApiError = typeof API_ERRORS[keyof typeof API_ERRORS]
export type UiError = typeof UI_ERRORS[keyof typeof UI_ERRORS]
