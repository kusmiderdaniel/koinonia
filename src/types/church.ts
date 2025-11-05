/**
 * Church-related types and interfaces
 */

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
  userId: string;
  churchId: string;
  role: ChurchRole;
  permissions: string[];
  ministries?: string[];
  joinedAt: Date;
  status: 'active' | 'inactive';
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
