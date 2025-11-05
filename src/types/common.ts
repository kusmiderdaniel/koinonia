/**
 * Common types and utilities used across the application
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export type NotificationType =
  | 'volunteer_invitation'
  | 'volunteer_reminder'
  | 'schedule_update'
  | 'event_created'
  | 'event_updated'
  | 'event_canceled';

export interface Notification {
  id: string;
  userId: string;
  churchId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface Ministry {
  id: string;
  churchId: string;
  name: string;
  description?: string;
  leaderId?: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, Saturday = 6

export interface ValidationError {
  field: string;
  message: string;
}
