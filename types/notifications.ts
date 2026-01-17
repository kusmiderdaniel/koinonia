// Notification types for the invitation workflow

export type AssignmentStatus = 'invited' | 'accepted' | 'declined' | 'expired' | null

export type NotificationType =
  | 'position_invitation'
  | 'invitation_response'
  | 'assignment_reminder'
  | 'event_update'
  | 'general'
  | 'task_assignment'
  | 'task_due_reminder'
  | 'task_comment'
  | 'pending_member'
  | 'unfilled_positions_reminder'

export type NotificationAction = 'accepted' | 'declined' | 'expired'

export interface NotificationEvent {
  id: string
  title: string
  start_time: string
  end_time: string
}

export interface NotificationPosition {
  id: string
  title: string
  ministry: {
    id: string
    name: string
    color: string
  }
}

export interface NotificationAssignment {
  id: string
  position: NotificationPosition
}

export interface Notification {
  id: string
  church_id: string
  recipient_id: string
  type: NotificationType
  title: string
  message: string | null
  event_id: string | null
  assignment_id: string | null
  is_read: boolean
  is_actioned: boolean
  action_taken: NotificationAction | null
  created_at: string
  read_at: string | null
  actioned_at: string | null
  expires_at: string | null
  // Joined data for display
  event?: NotificationEvent | null
  assignment?: NotificationAssignment | null
}
