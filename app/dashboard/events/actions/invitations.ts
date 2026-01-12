// This file re-exports all invitation actions for backward compatibility
// The actual implementations are in focused modules:
// - invitations-types.ts - Shared types
// - invitations-emails.ts - Email sending helper
// - invitations-send.ts - sendInvitations, sendBulkInvitations
// - invitations-counts.ts - getPendingInvitationCounts, getMatrixPendingInvitationCounts
// - invitations-respond.ts - respondToInvitation
// Note: Individual modules have 'use server' directives

export type {
  InvitationScope,
  SendInvitationsOptions,
  BulkInvitationScope,
  SendBulkInvitationsOptions,
} from './invitations-types'

export {
  sendInvitations,
  sendBulkInvitations,
} from './invitations-send'

export {
  getPendingInvitationCounts,
  getMatrixPendingInvitationCounts,
} from './invitations-counts'

export {
  respondToInvitation,
} from './invitations-respond'
