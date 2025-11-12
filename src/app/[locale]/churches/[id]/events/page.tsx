'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import { getChurch, getChurchMembership } from '@/lib/services/church';
import { getChurchEvents } from '@/lib/services/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, ArrowLeft, MapPin, Clock, Users } from 'lucide-react';
import type { Church } from '@/types/church';
import type { Event } from '@/types/event';
import Link from 'next/link';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';

export default function EventsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const churchId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [church, setChurch] = useState<Church | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/${locale}/auth/signin`);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [churchData, membership, eventsData] = await Promise.all([
          getChurch(churchId),
          getChurchMembership(churchId),
          getChurchEvents(churchId),
        ]);

        if (!isMounted) return;

        setChurch(churchData);
        setUserRole(membership?.role || null);
        setEvents(eventsData);
      } catch (err: any) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load events');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [churchId, authLoading, user, locale, router]);

  const isLeader = userRole === 'admin' || userRole === 'leader';

  const now = new Date();
  const upcomingEvents = events.filter(
    (event) => new Date(event.datetime.start) >= now && event.status !== 'canceled'
  );
  const pastEvents = events.filter(
    (event) => new Date(event.datetime.start) < now || event.status === 'canceled'
  );

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, { pl: string; en: string }> = {
      service: { pl: 'Nabożeństwo', en: 'Service' },
      meeting: { pl: 'Spotkanie', en: 'Meeting' },
      outreach: { pl: 'Ewangelizacja', en: 'Outreach' },
      social: { pl: 'Spotkanie towarzyskie', en: 'Social' },
      other: { pl: 'Inne', en: 'Other' },
    };
    return locale === 'pl' ? types[type]?.pl || type : types[type]?.en || type;
  };

  const getEventTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      service: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      meeting: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      outreach: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      social: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {locale === 'pl' ? 'Ładowanie wydarzeń...' : 'Loading events...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">
            {locale === 'pl' ? 'Błąd ładowania wydarzeń' : 'Error loading events'}
          </p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push(`/${locale}/churches/${churchId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do kościoła' : 'Back to Church'}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/churches/${churchId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do kościoła' : 'Back to Church'}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              {locale === 'pl' ? 'Wydarzenia' : 'Events'}
            </h1>
            {church && (
              <p className="text-muted-foreground mt-1">{church.name}</p>
            )}
          </div>
          {isLeader && (
            <Link href={`/${locale}/churches/${churchId}/events/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {locale === 'pl' ? 'Nowe wydarzenie' : 'New Event'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            {locale === 'pl' ? `Nadchodzące (${upcomingEvents.length})` : `Upcoming (${upcomingEvents.length})`}
          </TabsTrigger>
          <TabsTrigger value="past">
            {locale === 'pl' ? `Przeszłe (${pastEvents.length})` : `Past (${pastEvents.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'pl' ? 'Brak nadchodzących wydarzeń' : 'No Upcoming Events'}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {locale === 'pl'
                    ? 'Nie ma zaplanowanych wydarzeń. Sprawdź później.'
                    : 'There are no scheduled events. Check back later.'}
                </p>
                {isLeader && (
                  <Link href={`/${locale}/churches/${churchId}/events/new`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      {locale === 'pl' ? 'Utwórz pierwsze wydarzenie' : 'Create First Event'}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/${locale}/churches/${churchId}/events/${event.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {event.title}
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventTypeBadge(event.type)}`}
                          >
                            {getEventTypeLabel(event.type)}
                          </span>
                        </CardTitle>
                        {event.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {event.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(event.datetime.start), 'PPP p', {
                            locale: locale === 'pl' ? pl : enUS,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location.name}</span>
                      </div>
                      {event.roles && event.roles.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {`${event.roles.length} ${event.roles.length === 1 ? 'role' : 'roles'}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {locale === 'pl' ? 'Brak przeszłych wydarzeń' : 'No Past Events'}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {locale === 'pl'
                    ? 'Historia wydarzeń jest pusta.'
                    : 'Event history is empty.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastEvents.map((event) => (
                <Card
                  key={event.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    event.status === 'canceled' ? 'opacity-60' : ''
                  }`}
                  onClick={() => router.push(`/${locale}/churches/${churchId}/events/${event.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {event.title}
                          {event.status === 'canceled' && (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              {locale === 'pl' ? 'Anulowane' : 'Canceled'}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventTypeBadge(event.type)}`}
                          >
                            {getEventTypeLabel(event.type)}
                          </span>
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(event.datetime.start), 'PPP p', {
                            locale: locale === 'pl' ? pl : enUS,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location.name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
