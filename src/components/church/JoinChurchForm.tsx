'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { joinChurchSchema, type JoinChurchFormData } from '@/lib/validations/church';
import { joinChurchWithCode } from '@/lib/services/church';

export function JoinChurchForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinChurchFormData>({
    resolver: zodResolver(joinChurchSchema),
  });

  const onSubmit = async (data: JoinChurchFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const church = await joinChurchWithCode(data.inviteCode);
      router.push(`/churches/${church.id}`);
    } catch (err: any) {
      if (err.message.includes('not found')) {
        setError('Invalid invite code. Please check and try again.');
      } else if (err.message.includes('already a member')) {
        setError('You are already a member of this church.');
      } else {
        setError(err.message || 'Failed to join church. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Join a Church
        </CardTitle>
        <CardDescription>
          Enter the invite code provided by your church administrator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="inviteCode"
                placeholder="ABC12345"
                maxLength={8}
                className="pl-10 uppercase"
                {...register('inviteCode')}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
                disabled={isLoading}
              />
            </div>
            {errors.inviteCode && (
              <p className="text-sm text-destructive">{errors.inviteCode.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The invite code is 8 characters (letters and numbers)
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Church'}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an invite code?{' '}
            <button
              type="button"
              onClick={() => router.push('/churches/new')}
              className="text-primary hover:underline"
            >
              Create your own church
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
