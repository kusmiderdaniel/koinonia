/**
 * Event-related types and interfaces
 */

export type EventType = 'service' | 'meeting' | 'outreach' | 'social' | 'other';
export type EventStatus = 'draft' | 'published' | 'active' | 'completed' | 'canceled';
export type VolunteerStatus = 'invited' | 'accepted' | 'declined' | 'confirmed' | 'no_show';
export type RecurrencePattern = 'weekly' | 'biweekly' | 'monthly';

export interface EventLocation {
  name: string;
  address?: string;
  room?: string;
}

export interface EventDateTime {
  start: Date;
  end: Date;
  timezone: string;
}

export interface EventRecurrence {
  pattern: RecurrencePattern;
  endDate?: Date;
  exceptions: Date[]; // Dates to skip
}

export interface EventRequirements {
  backgroundCheck?: boolean;
  training?: string[];
  minimumAge?: number;
}

export interface VolunteerAssignment {
  userId: string;
  status: VolunteerStatus;
  assignedAt: Date;
  responseAt?: Date;
  notes?: string;
}

export interface EventRole {
  id: string;
  name: string;
  description: string;
  requiredCount: number;
  skills?: string[];
  assignments: VolunteerAssignment[];
  requirements?: EventRequirements;
}

export interface EventSettings {
  requireApproval: boolean;
  allowSelfSignup: boolean;
  reminderHours: number[]; // e.g., [24, 48] for reminders 24 and 48 hours before
  maxVolunteers?: number;
}

export interface Event {
  id: string;
  churchId: string;
  title: string;
  description: string;
  type: EventType;
  category: string;
  location: EventLocation;
  datetime: EventDateTime;
  recurrence?: EventRecurrence;
  roles: EventRole[];
  status: EventStatus;
  settings: EventSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventWithVolunteers extends Event {
  volunteers: {
    role: EventRole;
    volunteers: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      avatar?: string;
      assignment: VolunteerAssignment;
    }>;
  }[];
  stats: {
    totalSlots: number;
    filledSlots: number;
    pendingResponses: number;
  };
}

export interface EventTemplate {
  id: string;
  churchId: string;
  name: string;
  description: string;
  type: EventType;
  defaultRoles: Omit<EventRole, 'id' | 'assignments'>[];
  defaultSettings: EventSettings;
}
