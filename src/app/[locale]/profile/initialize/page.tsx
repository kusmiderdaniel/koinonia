'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InitializeProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setHasProfile(true);
        } else {
          // Pre-fill from Firebase Auth if available
          const displayName = user.displayName || '';
          const nameParts = displayName.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setChecking(false);
      }
    };

    if (!authLoading && user) {
      checkProfile();
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const userDoc = {
        email: user.email,
        profile: {
          firstName,
          lastName,
          phone: '',
          avatar: user.photoURL || '',
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

      await setDoc(doc(db, 'users', user.uid), userDoc);

      router.push(`/${locale}/dashboard`);
    } catch (error: any) {
      console.error('Error creating profile:', error);
      alert(locale === 'pl' ? 'Nie udało się utworzyć profilu' : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {locale === 'pl' ? 'Sprawdzanie profilu...' : 'Checking profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>
              {locale === 'pl' ? 'Wymagane logowanie' : 'Login Required'}
            </CardTitle>
            <CardDescription>
              {locale === 'pl'
                ? 'Musisz być zalogowany, aby zainicjować swój profil'
                : 'You must be logged in to initialize your profile'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/${locale}/auth/signin`)}>
              {locale === 'pl' ? 'Przejdź do logowania' : 'Go to Sign In'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasProfile) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>
              {locale === 'pl' ? 'Profil już istnieje' : 'Profile Already Exists'}
            </CardTitle>
            <CardDescription>
              {locale === 'pl'
                ? 'Twój profil został już utworzony'
                : 'Your profile has already been created'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/${locale}/dashboard`)}>
              {locale === 'pl' ? 'Przejdź do pulpitu' : 'Go to Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>
            {locale === 'pl' ? 'Zainicjuj swój profil' : 'Initialize Your Profile'}
          </CardTitle>
          <CardDescription>
            {locale === 'pl'
              ? 'Uzupełnij swoje podstawowe informacje, aby kontynuować'
              : 'Complete your basic information to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                {locale === 'pl' ? 'Imię' : 'First Name'} *
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                {locale === 'pl' ? 'Nazwisko' : 'Last Name'} *
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? locale === 'pl'
                  ? 'Tworzenie profilu...'
                  : 'Creating Profile...'
                : locale === 'pl'
                ? 'Utwórz profil'
                : 'Create Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
