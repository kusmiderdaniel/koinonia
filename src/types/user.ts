import { ChurchMembership } from './church';

/**
 * User-related types and interfaces
 */

export interface TimeSlot {
  start: string; // Format: "HH:mm"
  end: string; // Format: "HH:mm"
}

export interface DateRange {
  start: Date;
  end: Date;
  reason?: string;
}

export interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    bio?: string;
  };
  churchMemberships: {
    [churchId: string]: ChurchMembership;
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    timezone: string;
  };
  availability?: {
    recurring: {
      [dayOfWeek: number]: TimeSlot[]; // 0-6 (Sunday-Saturday)
    };
    blackoutDates: DateRange[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
}

export interface CustomClaims {
  churches: {
    [churchId: string]: {
      role: 'admin' | 'leader' | 'volunteer';
      ministries: string[];
    };
  };
}
