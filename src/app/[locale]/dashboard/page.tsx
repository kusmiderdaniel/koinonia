'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth, useChurch } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Church, Plus, Users, Calendar, Music } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  const tChurch = useTranslations('church');
  const { user, loading: authLoading } = useAuth();
  const { churches, currentChurch, loading: churchLoading, setCurrentChurch } = useChurch();

  const loading = authLoading || churchLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {locale === 'pl' ? 'Proszę się zalogować' : 'Please sign in'}
          </h1>
          <a href={`/${locale}/auth/signin`} className="text-primary hover:underline">
            {locale === 'pl' ? 'Przejdź do logowania' : 'Go to sign in'}
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
          {locale === 'pl'
            ? `Witaj ponownie, ${user.displayName || 'użytkowniku'}!`
            : `Welcome back, ${user.displayName || 'there'}!`
          }
        </h1>
        <p className="text-muted-foreground">
          {currentChurch
            ? (locale === 'pl' ? `Zarządzasz ${currentChurch.name}` : `Managing ${currentChurch.name}`)
            : (locale === 'pl' ? 'Zacznij od dołączenia lub utworzenia kościoła' : 'Get started by joining or creating a church')
          }
        </p>
      </div>

      {/* Quick Stats */}
      {currentChurch && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'pl' ? 'Obecny kościół' : 'Current Church'}
              </CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentChurch.name}</div>
              <p className="text-xs text-muted-foreground">
                {currentChurch.denomination || (locale === 'pl' ? 'Niedenominacyjny' : 'Non-denominational')}
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/${locale}/churches/${currentChurch.id}/events`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'pl' ? 'Wydarzenia' : 'Events'}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'pl' ? 'Nadchodzące wydarzenia' : 'Upcoming events'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'pl' ? 'Wolontariusze' : 'Volunteers'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'pl' ? 'Aktywni wolontariusze' : 'Active volunteers'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'pl' ? 'Piosenki' : 'Songs'}
              </CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'pl' ? 'W bibliotece' : 'In library'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!currentChurch && churches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Church className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {locale === 'pl' ? 'Jeszcze brak kościołów' : 'No Churches Yet'}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {tChurch('noChurchesDescription')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/churches/join`)}
              >
                <Users className="mr-2 h-4 w-4" />
                {tChurch('joinChurch')}
              </Button>
              <Button onClick={() => router.push(`/${locale}/churches/new`)}>
                <Plus className="mr-2 h-4 w-4" />
                {tChurch('createChurch')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
