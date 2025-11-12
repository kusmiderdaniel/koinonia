'use client';

import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth, resetPassword } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const testPasswordReset = async () => {
    setMessage('');
    setError('');
    try {
      await resetPassword(email);
      setMessage(`Password reset email sent to ${email}. Check your inbox (and spam folder).`);
    } catch (err: any) {
      console.error('Error:', err);
      setError(`Error: ${err.code || err.message}`);
    }
  };

  const testEmailVerification = async () => {
    setMessage('');
    setError('');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError('No user signed in. Please sign in first.');
      return;
    }

    try {
      await sendEmailVerification(currentUser);
      setMessage(`Email verification sent to ${currentUser.email}. Check your inbox (and spam folder).`);
    } catch (err: any) {
      console.error('Error:', err);
      setError(`Error: ${err.code || err.message}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Email Testing</h1>
          <p className="text-muted-foreground">
            Test Firebase email functionality
          </p>
        </div>

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Current User Info:</h2>
            <div className="p-4 bg-muted rounded-md text-sm">
              {auth.currentUser ? (
                <>
                  <p><strong>Email:</strong> {auth.currentUser.email}</p>
                  <p><strong>Email Verified:</strong> {auth.currentUser.emailVerified ? 'Yes' : 'No'}</p>
                  <p><strong>UID:</strong> {auth.currentUser.uid}</p>
                </>
              ) : (
                <p>No user signed in</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Test Password Reset Email</label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={testPasswordReset} className="w-full">
              Send Password Reset Email
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Test Email Verification (for signed-in user)</label>
            <Button onClick={testEmailVerification} className="w-full" variant="outline">
              Send Email Verification
            </Button>
          </div>
        </div>

        <div className="text-center text-sm">
          <a href="/auth/signin" className="text-primary hover:underline">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
