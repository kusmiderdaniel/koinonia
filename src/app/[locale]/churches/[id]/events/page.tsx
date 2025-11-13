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
import { Calendar, Plus, MapPin, Clock, Users, FileText, ChevronRight } from 'lucide-react';
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
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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

  // Auto-select first event when events are loaded
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      const upcomingEvents = events.filter(
        (event) => new Date(event.datetime.start) >= new Date() && event.status !== 'canceled'
      );
      setSelectedEvent(upcomingEvents.length > 0 ? upcomingEvents[0] : events[0]);
    }
  }, [events, selectedEvent]);

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

  const safeFormatDate = (date: Date | string, formatStr: string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return locale === 'pl' ? 'Nieprawidłowa data' : 'Invalid date';
      }
      return format(dateObj, formatStr, {
        locale: locale === 'pl' ? pl : enUS,
      });
    } catch (error) {
      return locale === 'pl' ? 'Nieprawidłowa data' : 'Invalid date';
    }
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
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          {locale === 'pl' ? 'Wydarzenia' : 'Events'}
        </h1>
        {isLeader && (
          <Link href={`/${locale}/churches/${churchId}/events/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {locale === 'pl' ? 'Nowe wydarzenie' : 'New Event'}
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Events List - Left Side */}
        <div className="w-96 flex flex-col">
          <Tabs defaultValue="upcoming" className="flex flex-col h-full">
            <TabsList className="w-full">
              <TabsTrigger value="upcoming" className="flex-1">
                {locale === 'pl' ? `Nadchodzące (${upcomingEvents.length})` : `Upcoming (${upcomingEvents.length})`}
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                {locale === 'pl' ? `Przeszłe (${pastEvents.length})` : `Past (${pastEvents.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="flex-1 overflow-y-auto mt-4 space-y-2">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {locale === 'pl'
                      ? 'Brak nadchodzących wydarzeń'
                      : 'No upcoming events'}
                  </p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                      selectedEvent?.id === event.id
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50 border-transparent'
                    }`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">
                          {safeFormatDate(event.datetime.start, 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location.name}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2 ${getEventTypeBadge(event.type)}`}
                    >
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="flex-1 overflow-y-auto mt-4 space-y-2">
              {pastEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {locale === 'pl'
                      ? 'Brak przeszłych wydarzeń'
                      : 'No past events'}
                  </p>
                </div>
              ) : (
                pastEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                      selectedEvent?.id === event.id
                        ? 'bg-accent border-primary'
                        : 'hover:bg-accent/50 border-transparent'
                    } ${event.status === 'canceled' ? 'opacity-60' : ''}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                    {event.status === 'canceled' && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 mb-1">
                        {locale === 'pl' ? 'Anulowane' : 'Canceled'}
                      </span>
                    )}
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="truncate">
                          {safeFormatDate(event.datetime.start, 'PPP')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{event.location.name}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2 ${getEventTypeBadge(event.type)}`}
                    >
                      {getEventTypeLabel(event.type)}
                    </span>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Event Details - Right Side */}
        <div className="flex-1 overflow-hidden">
          {selectedEvent ? (
            <Card className="h-full overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{selectedEvent.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventTypeBadge(selectedEvent.type)}`}
                      >
                        {getEventTypeLabel(selectedEvent.type)}
                      </span>
                      {selectedEvent.status === 'canceled' && (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          {locale === 'pl' ? 'Anulowane' : 'Canceled'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/${locale}/churches/${churchId}/events/${selectedEvent.id}`}>
                    <Button variant="outline" size="sm">
                      {locale === 'pl' ? 'Szczegóły' : 'Details'}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedEvent.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      {locale === 'pl' ? 'Opis' : 'Description'}
                    </h3>
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {locale === 'pl' ? 'Data' : 'Date'}
                      </h3>
                      <p className="text-sm">
                        {safeFormatDate(selectedEvent.datetime.start, 'PPP')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {locale === 'pl' ? 'Godzina' : 'Time'}
                      </h3>
                      <p className="text-sm">
                        {safeFormatDate(selectedEvent.datetime.start, 'p')}
                        {' - '}
                        {safeFormatDate(selectedEvent.datetime.end, 'p')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {locale === 'pl' ? 'Lokalizacja' : 'Location'}
                    </h3>
                    <p className="text-sm">{selectedEvent.location.name}</p>
                    {selectedEvent.location.address && (
                      <p className="text-sm text-muted-foreground">{selectedEvent.location.address}</p>
                    )}
                    {selectedEvent.location.room && (
                      <p className="text-sm text-muted-foreground">
                        {locale === 'pl' ? 'Sala' : 'Room'}: {selectedEvent.location.room}
                      </p>
                    )}
                  </div>
                </div>

                {selectedEvent.agenda && selectedEvent.agenda.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {locale === 'pl' ? 'Agenda' : 'Agenda'}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {selectedEvent.agenda
                        .sort((a, b) => a.order - b.order)
                        .map((item, index) => (
                          <div key={item.id} className="flex items-start gap-3 text-sm p-2 rounded bg-muted/30">
                            <span className="text-xs text-muted-foreground font-medium w-6 text-right mt-0.5">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <div className="font-medium">{item.title}</div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedEvent.roles && selectedEvent.roles.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {locale === 'pl' ? 'Role wolontariuszy' : 'Volunteer Roles'}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {selectedEvent.roles.map((role) => (
                        <div key={role.id} className="p-3 rounded border">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-sm">{role.name}</h4>
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {role.assignments.length} / {role.requiredCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {locale === 'pl' ? 'Wybierz wydarzenie' : 'Select an Event'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {locale === 'pl'
                    ? 'Wybierz wydarzenie z listy, aby zobaczyć szczegóły'
                    : 'Select an event from the list to view details'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
