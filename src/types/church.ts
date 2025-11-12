/**
 * Church-related types and interfaces
 */

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string[]; // For select type
  order: number;
}

export interface ChurchRoom {
  id: string;
  name: string;
  capacity?: number;
  description?: string;
  isDefault?: boolean;
}

export interface Church {
  id: string;
  name: string;
  denomination?: string | null;
  description?: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    website?: string | null;
  };
  rooms?: ChurchRoom[];
  customFields?: CustomField[];
  inviteCode: string;
  settings: {
    features: {
      events: boolean;
      volunteers: boolean;
      songs: boolean;
      announcements: boolean;
    };
    permissions: {
      whoCanCreateEvents: ChurchRole[];
      whoCanManageVolunteers: ChurchRole[];
      whoCanManageSongs: ChurchRole[];
    };
    timezone?: string;
    defaultReminderHours?: number;
    requireApprovalForJoin?: boolean;
    allowPublicEvents?: boolean;
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  subscription?: {
    plan: 'free' | 'basic' | 'premium';
    status: 'active' | 'canceled' | 'past_due';
    currentPeriodEnd: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type ChurchRole = 'admin' | 'leader' | 'volunteer' | 'member';

export interface ChurchMembership {
  id: string;
  userId?: string | null; // Optional - null if person doesn't have an account yet
  email?: string | null; // For linking when user creates account later
  firstName?: string | null; // For people without accounts
  lastName?: string | null; // For people without accounts
  churchId: string;
  role: ChurchRole;
  permissions: string[];
  ministries?: string[];
  customFieldValues?: Record<string, any>; // key is field id, value is the field value
  joinedAt: Date;
  status: 'active' | 'inactive';
}

export interface ChurchMembershipWithUser extends ChurchMembership {
  userName: string;
  userEmail: string;
}

export interface ChurchInvitation {
  id: string;
  churchId: string;
  email: string;
  role: ChurchRole;
  ministries?: string[];
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}
