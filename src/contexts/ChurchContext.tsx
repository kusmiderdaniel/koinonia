'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import type { Church, ChurchMembership } from '@/types/church';
import { getUserChurches, getChurchMembership } from '@/lib/services/church';

interface ChurchContextType {
  churches: Church[];
  currentChurch: Church | null;
  currentMembership: ChurchMembership | null;
  loading: boolean;
  error: string | null;
  setCurrentChurch: (church: Church | null) => void;
  refreshChurches: () => Promise<void>;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [churches, setChurches] = useState<Church[]>([]);
  const [currentChurch, setCurrentChurch] = useState<Church | null>(null);
  const [currentMembership, setCurrentMembership] = useState<ChurchMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load churches when user logs in
  const loadChurches = async () => {
    if (!isAuthenticated) {
      setChurches([]);
      setCurrentChurch(null);
      setCurrentMembership(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userChurches = await getUserChurches();
      setChurches(userChurches);

      // Try to load saved church from localStorage
      const savedChurchId = localStorage.getItem('currentChurchId');
      if (savedChurchId && userChurches.find((c) => c.id === savedChurchId)) {
        const savedChurch = userChurches.find((c) => c.id === savedChurchId);
        if (savedChurch) {
          setCurrentChurch(savedChurch);
          const membership = await getChurchMembership(savedChurch.id);
          setCurrentMembership(membership);
        }
      } else if (userChurches.length > 0) {
        // Default to first church if no saved preference
        setCurrentChurch(userChurches[0]);
        const membership = await getChurchMembership(userChurches[0].id);
        setCurrentMembership(membership);
      }
    } catch (err: any) {
      console.error('Error loading churches:', err);
      setError(err.message || 'Failed to load churches');
    } finally {
      setLoading(false);
    }
  };

  // Load churches on mount and when auth state changes
  useEffect(() => {
    loadChurches();
  }, [isAuthenticated, user]);

  // Update membership when current church changes
  useEffect(() => {
    const loadMembership = async () => {
      if (!currentChurch) {
        setCurrentMembership(null);
        return;
      }

      try {
        const membership = await getChurchMembership(currentChurch.id);
        setCurrentMembership(membership);
        // Save preference
        localStorage.setItem('currentChurchId', currentChurch.id);
      } catch (err) {
        console.error('Error loading membership:', err);
      }
    };

    loadMembership();
  }, [currentChurch]);

  const refreshChurches = async () => {
    await loadChurches();
  };

  const value = {
    churches,
    currentChurch,
    currentMembership,
    loading,
    error,
    setCurrentChurch,
    refreshChurches,
  };

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>;
}

export function useChurch() {
  const context = useContext(ChurchContext);
  if (context === undefined) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
}
