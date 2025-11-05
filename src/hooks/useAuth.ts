'use client';

import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { ChurchRole } from '@/types';

/**
 * Hook for accessing authentication state and user information
 */
export const useAuth = () => {
  return useAuthContext();
};

/**
 * Hook to check if user has access to a specific church
 */
export const useChurchAccess = (churchId: string) => {
  const { claims, isAuthenticated } = useAuthContext();

  if (!isAuthenticated || !claims?.churches) {
    return {
      hasAccess: false,
      role: null,
      ministries: [],
    };
  }

  const churchMembership = claims.churches[churchId];

  return {
    hasAccess: !!churchMembership,
    role: churchMembership?.role || null,
    ministries: churchMembership?.ministries || [],
  };
};

/**
 * Hook to check if user has a specific role for a church
 */
export const useChurchRole = (
  churchId: string,
  requiredRole?: ChurchRole
) => {
  const { hasAccess, role } = useChurchAccess(churchId);

  if (!hasAccess || !role) {
    return false;
  }

  if (!requiredRole) {
    return true; // User is a member of the church
  }

  // Admin has all permissions
  if (role === 'admin') return true;

  // Leader has leader and volunteer permissions
  if (role === 'leader' && requiredRole !== 'admin') return true;

  // Volunteer only has volunteer permissions
  if (role === 'volunteer' && requiredRole === 'volunteer') return true;

  return false;
};

/**
 * Hook to get all churches the user is a member of
 */
export const useUserChurches = () => {
  const { claims } = useAuthContext();

  if (!claims?.churches) {
    return [];
  }

  return Object.entries(claims.churches).map(([churchId, membership]) => ({
    churchId,
    ...membership,
  }));
};
