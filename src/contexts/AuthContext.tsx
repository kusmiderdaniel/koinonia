'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChange, getCurrentUser } from '@/lib/firebase';
import { db } from '@/lib/firebase/config';
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

          // Check if user profile exists in Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // Create user profile if it doesn't exist
            console.log('Creating user profile for existing user');
            const displayName = firebaseUser.displayName || '';
            const nameParts = displayName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const userDoc = {
              email: firebaseUser.email,
              profile: {
                firstName,
                lastName,
                phone: '',
                avatar: firebaseUser.photoURL || '',
                bio: '',
              },
              churchMemberships: {},
              preferences: {
                emailNotifications: true,
                smsNotifications: false,
                pushNotifications: true,
                timezone: 'Europe/Warsaw',
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            await setDoc(userDocRef, userDoc);
          }
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
