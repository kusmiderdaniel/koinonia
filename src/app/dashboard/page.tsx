'use client';

import { useRouter } from 'next/navigation';
import { useAuth, useChurch } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Church, Plus, Users, Calendar, Music } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { churches, currentChurch, loading: churchLoading, setCurrentChurch } = useChurch();

  const loading = authLoading || churchLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <a href="/auth/signin" className="text-primary hover:underline">
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user.displayName || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          {currentChurch
            ? `Managing ${currentChurch.name}`
            : 'Get started by joining or creating a church'}
        </p>
      </div>

      {/* Quick Stats */}
      {currentChurch && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Church</CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentChurch.name}</div>
              <p className="text-xs text-muted-foreground">
                {currentChurch.denomination || 'Non-denominational'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Active volunteers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Songs</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">In library</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Churches Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Churches</h2>
            <p className="text-muted-foreground">
              {churches.length === 0
                ? 'You are not a member of any churches yet'
                : `You are a member of ${churches.length} ${churches.length === 1 ? 'church' : 'churches'}`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/churches/join')}
            >
              <Users className="mr-2 h-4 w-4" />
              Join Church
            </Button>
            <Button onClick={() => router.push('/churches/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Church
            </Button>
          </div>
        </div>

        {churches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Church className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Churches Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Get started by creating your own church or joining an existing one with an invite code.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/churches/join')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Join Church
                </Button>
                <Button onClick={() => router.push('/churches/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Church
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {churches.map((church) => (
              <Card
                key={church.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  currentChurch?.id === church.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => {
                  setCurrentChurch(church);
                  router.push(`/churches/${church.id}`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Church className="h-5 w-5" />
                        {church.name}
                      </CardTitle>
                      {church.denomination && (
                        <CardDescription className="mt-1">
                          {church.denomination}
                        </CardDescription>
                      )}
                    </div>
                    {currentChurch?.id === church.id && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {church.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {church.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
