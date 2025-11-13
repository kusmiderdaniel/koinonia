'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import { createEvent } from '@/lib/services/event';
import { getChurch } from '@/lib/services/church';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { EventType } from '@/types/event';
import type { Church } from '@/types/church';

export default function NewEventPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const churchId = params.id as string;
  const { user } = useAuth();

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingChurch, setLoadingChurch] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [locationMode, setLocationMode] = useState<'room' | 'custom'>('room');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  // Calculate next Sunday
  const getNextSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek; // If today is Sunday, get next Sunday
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'service' as EventType,
    locationName: '',
    locationAddress: '',
    locationRoom: '',
    startDate: getNextSunday(),
    startTime: '10:00',
    endDate: getNextSunday(),
    endTime: '12:00',
    isTemplate: false,
  });

  useEffect(() => {
    const loadChurch = async () => {
      try {
        const churchData = await getChurch(churchId);
        setChurch(churchData);
        // If church has rooms, default to room mode, otherwise custom
        if (churchData.rooms && churchData.rooms.length > 0) {
          setLocationMode('room');
          // Pre-select the default room if one is set
          const defaultRoom = churchData.rooms.find(room => room.isDefault);
          if (defaultRoom) {
            setSelectedRoomId(defaultRoom.id);
          }
        } else {
          setLocationMode('custom');
        }
      } catch (err) {
        console.error('Error loading church:', err);
      } finally {
        setLoadingChurch(false);
      }
    };
    loadChurch();
  }, [churchId]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      const missingTitle = !formData.title;
      const missingLocation = locationMode === 'room' ? !selectedRoomId : !formData.locationName;
      const missingDates = !formData.isTemplate && (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime);

      if (missingTitle || missingLocation || missingDates) {
        setError(locale === 'pl' ? 'Wypełnij wszystkie wymagane pola' : 'Please fill in all required fields');
        setShowErrorDialog(true);
        return;
      }

      // Construct datetime objects (only for non-templates)
      let startDateTime, endDateTime;
      if (!formData.isTemplate) {
        startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        // Validate dates
        if (endDateTime <= startDateTime) {
          setError(locale === 'pl' ? 'Data/godzina zakończenia musi być po dacie/godzinie rozpoczęcia' : 'End date/time must be after start date/time');
          setShowErrorDialog(true);
          return;
        }
      }

      // Determine location based on mode
      let location;
      if (locationMode === 'room' && church) {
        const selectedRoom = church.rooms?.find(r => r.id === selectedRoomId);
        if (!selectedRoom) {
          setError(locale === 'pl' ? 'Wybierz pomieszczenie' : 'Please select a room');
          setShowErrorDialog(true);
          return;
        }

        // Build full address
        const fullAddress = `${church.address.street}, ${church.address.zipCode} ${church.address.city}`;
        location = {
          name: selectedRoom.name,
          address: fullAddress,
          room: selectedRoom.description || undefined,
        };
      } else {
        location = {
          name: formData.locationName,
          address: formData.locationAddress || undefined,
          room: formData.locationRoom || undefined,
        };
      }

      // Create event
      const event = await createEvent(churchId, {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        location,
        datetime: {
          start: formData.isTemplate ? new Date('1970-01-01T00:00:00') : startDateTime!,
          end: formData.isTemplate ? new Date('1970-01-01T00:00:00') : endDateTime!,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        roles: [],
        status: 'published',
        isTemplate: formData.isTemplate,
        settings: {
          requireApproval: false,
          allowSelfSignup: true,
          reminderHours: [24],
        },
      });

      // Navigate to event detail page
      router.push(`/${locale}/churches/${churchId}/events/${event.id}`);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/churches/${churchId}/events`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do wydarzeń' : 'Back to Events'}
        </Link>
        <h1 className="text-3xl font-bold">
          {locale === 'pl' ? 'Utwórz nowe wydarzenie' : 'Create New Event'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'pl'
            ? 'Wypełnij szczegóły, aby utworzyć nowe wydarzenie dla Twojego kościoła'
            : 'Fill in the details to create a new event for your church'}
        </p>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'pl' ? 'Błąd walidacji' : 'Validation Error'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              {locale === 'pl' ? 'OK' : 'OK'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>{locale === 'pl' ? 'Szczegóły wydarzenia' : 'Event Details'}</CardTitle>
          <CardDescription>
            {locale === 'pl'
              ? 'Podaj podstawowe informacje o wydarzeniu'
              : 'Provide basic information about the event'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title and Type */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                {locale === 'pl' ? 'Tytuł wydarzenia' : 'Event Title'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={locale === 'pl' ? 'Nabożeństwo niedzielne' : 'Sunday Service'}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                {locale === 'pl' ? 'Typ wydarzenia' : 'Event Type'} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: EventType) => setFormData({ ...formData, type: value })}
                disabled={loading}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">{locale === 'pl' ? 'Nabożeństwo' : 'Service'}</SelectItem>
                  <SelectItem value="meeting">{locale === 'pl' ? 'Spotkanie' : 'Meeting'}</SelectItem>
                  <SelectItem value="outreach">{locale === 'pl' ? 'Ewangelizacja' : 'Outreach'}</SelectItem>
                  <SelectItem value="social">{locale === 'pl' ? 'Spotkanie towarzyskie' : 'Social'}</SelectItem>
                  <SelectItem value="other">{locale === 'pl' ? 'Inne' : 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {locale === 'pl' ? 'Opis' : 'Description'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={locale === 'pl'
                ? 'Opisz, o czym jest to wydarzenie...'
                : 'Describe what this event is about...'}
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Template Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTemplate"
              checked={formData.isTemplate}
              onCheckedChange={(checked) => setFormData({ ...formData, isTemplate: checked as boolean })}
              disabled={loading}
            />
            <Label
              htmlFor="isTemplate"
              className="text-sm font-normal cursor-pointer"
            >
              {locale === 'pl'
                ? 'Zapisz jako szablon (szablon nie będzie miał daty i będzie służył jako wzór dla przyszłych wydarzeń)'
                : 'Save as template (template will not have a date and will serve as a blueprint for future events)'}
            </Label>
          </div>

          {/* Date and Time - Hidden for templates */}
          {!formData.isTemplate && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                {locale === 'pl' ? 'Data i godzina' : 'Date & Time'}
              </Label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    {locale === 'pl' ? 'Data rozpoczęcia' : 'Start Date'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    {locale === 'pl' ? 'Godzina rozpoczęcia' : 'Start Time'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    {locale === 'pl' ? 'Data zakończenia' : 'End Date'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    {locale === 'pl' ? 'Godzina zakończenia' : 'End Time'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">
              {locale === 'pl' ? 'Lokalizacja' : 'Location'}
            </Label>

            {church && church.rooms && church.rooms.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="locationMode">
                  {locale === 'pl' ? 'Wybierz typ lokalizacji' : 'Select location type'}
                </Label>
                <Select
                  value={locationMode}
                  onValueChange={(value: 'room' | 'custom') => {
                    setLocationMode(value);
                    if (value === 'room') {
                      setSelectedRoomId('');
                    }
                  }}
                  disabled={loading}
                >
                  <SelectTrigger id="locationMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room">
                      {locale === 'pl' ? 'Pomieszczenie kościoła' : 'Church Room'}
                    </SelectItem>
                    <SelectItem value="custom">
                      {locale === 'pl' ? 'Inna lokalizacja' : 'Custom Location'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {locationMode === 'room' && church && church.rooms && church.rooms.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="roomSelect">
                  {locale === 'pl' ? 'Wybierz pomieszczenie' : 'Select Room'} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedRoomId}
                  onValueChange={setSelectedRoomId}
                  disabled={loading}
                >
                  <SelectTrigger id="roomSelect">
                    <SelectValue placeholder={locale === 'pl' ? 'Wybierz pomieszczenie...' : 'Select a room...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {church.rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                        {room.capacity && ` (${locale === 'pl' ? 'Pojemność' : 'Capacity'}: ${room.capacity})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoomId && church.rooms.find(r => r.id === selectedRoomId)?.description && (
                  <p className="text-sm text-muted-foreground">
                    {church.rooms.find(r => r.id === selectedRoomId)?.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {locale === 'pl' ? 'Adres' : 'Address'}: {church.address.street}, {church.address.zipCode} {church.address.city}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="locationName">
                    {locale === 'pl' ? 'Nazwa miejsca' : 'Location Name'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="locationName"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    placeholder={locale === 'pl' ? 'Główna świątynia' : 'Main Sanctuary'}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationAddress">
                    {locale === 'pl' ? 'Adres' : 'Address'}
                  </Label>
                  <Input
                    id="locationAddress"
                    value={formData.locationAddress}
                    onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                    placeholder={locale === 'pl' ? 'ul. Kościelna 123' : '123 Church Street'}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationRoom">
                    {locale === 'pl' ? 'Sala' : 'Room'}
                  </Label>
                  <Input
                    id="locationRoom"
                    value={formData.locationRoom}
                    onChange={(e) => setFormData({ ...formData, locationRoom: e.target.value })}
                    placeholder={locale === 'pl' ? 'Sala 101' : 'Room 101'}
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading
                ? (locale === 'pl' ? 'Tworzenie...' : 'Creating...')
                : (locale === 'pl' ? 'Utwórz wydarzenie' : 'Create Event')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
