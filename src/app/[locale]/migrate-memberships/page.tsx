'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function MigrateMembershipsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);

  const migrateMemberships = async () => {
    if (!user) {
      setResult({ success: false, message: 'You must be logged in to migrate memberships' });
      return;
    }

    try {
      setMigrating(true);
      setResult(null);

      const details: string[] = [];

      // Find all memberships for this user
      const membershipsRef = collection(db, 'churchMemberships');
      const q = query(membershipsRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setResult({ success: true, message: 'No memberships found to migrate', details: ['You have no church memberships yet.'] });
        setMigrating(false);
        return;
      }

      details.push(`Found ${snapshot.docs.length} membership(s) to check`);

      let migratedCount = 0;
      let skippedCount = 0;

      for (const membershipDoc of snapshot.docs) {
        const data = membershipDoc.data();
        const oldId = membershipDoc.id;
        const expectedId = `${data.userId}_${data.churchId}`;

        // Check if already in correct format
        if (oldId === expectedId) {
          details.push(`✓ Membership for church ${data.churchId} already in correct format`);
          skippedCount++;
          continue;
        }

        // Check if target document already exists
        const newDocRef = doc(db, 'churchMemberships', expectedId);
        const newDocSnap = await getDoc(newDocRef);

        if (newDocSnap.exists()) {
          details.push(`⚠ Membership document ${expectedId} already exists, deleting old one`);
          await deleteDoc(doc(db, 'churchMemberships', oldId));
          migratedCount++;
          continue;
        }

        // Migrate: create new document with correct ID and delete old one
        await setDoc(newDocRef, data);
        await deleteDoc(doc(db, 'churchMemberships', oldId));

        details.push(`✓ Migrated membership from ${oldId} to ${expectedId}`);
        migratedCount++;
      }

      setResult({
        success: true,
        message: `Migration complete! Migrated ${migratedCount}, skipped ${skippedCount}`,
        details,
      });
    } catch (error: any) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        message: 'Migration failed',
        details: [error.message || 'Unknown error occurred'],
      });
    } finally {
      setMigrating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please sign in to migrate your memberships</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push(`/${locale}/auth/signin`)}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Migrate Church Memberships
          </CardTitle>
          <CardDescription>
            This utility will migrate your existing church memberships to the new document ID format.
            This is a one-time operation needed due to a recent update in how memberships are stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What does this do?</h3>
            <p className="text-sm text-muted-foreground">
              This will update your church membership documents to use a new ID format that improves
              performance and security. Your membership data and roles will remain unchanged.
            </p>
          </div>

          <Button
            onClick={migrateMemberships}
            disabled={migrating}
            size="lg"
            className="w-full"
          >
            {migrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {migrating ? 'Migrating...' : 'Run Migration'}
          </Button>

          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="font-semibold">{result.message}</h3>
              </div>
              {result.details && result.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.details.map((detail, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground font-mono">
                      {detail}
                    </p>
                  ))}
                </div>
              )}
              {result.success && (
                <Button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="mt-4"
                  variant="outline"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
