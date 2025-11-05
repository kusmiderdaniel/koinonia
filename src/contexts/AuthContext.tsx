'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getCurrentUser } from '@/lib/firebase';
import { User as AppUser, CustomClaims } from '@/types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  claims: CustomClaims | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  claims: null,
  loading: true,
  isAuthenticated: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [claims, setClaims] = useState<CustomClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const tokenClaims = idTokenResult.claims;

          // Only set claims if churches property exists
          if (tokenClaims.churches) {
            setClaims(tokenClaims as unknown as CustomClaims);
          } else {
            setClaims(null);
          }

          // TODO: Fetch full user profile from Firestore
          // This would be implemented when we have the user service
          // const userProfile = await getUserProfile(firebaseUser.uid);
          // setAppUser(userProfile);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setAppUser(null);
        setClaims(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    appUser,
    claims,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
