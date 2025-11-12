'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import { getChurch, getChurchMembership, updateChurch } from '@/lib/services/church';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Save, Plus, X, MapPin, Mail, Phone, Globe, Copy, Check, Key, Church as ChurchIcon, List, GripVertical } from 'lucide-react';
import type { Church, ChurchRoom, CustomField, CustomFieldType } from '@/types/church';

export default function ChurchSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const churchId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLeader, setIsLeader] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [rooms, setRooms] = useState<ChurchRoom[]>([]);

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    type: 'text' as CustomFieldType,
    required: false,
    options: [] as string[],
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(`/${locale}/auth/signin`);
      return;
    }

    let isMounted = true;

    const loadChurchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const churchData = await getChurch(churchId);

        if (!isMounted) return;

        setChurch(churchData);

        // Populate form fields
        setName(churchData.name);
        setDenomination(churchData.denomination || '');
        setDescription(churchData.description || '');
        setStreet(churchData.address.street);
        setCity(churchData.address.city);
        setState(churchData.address.state);
        setZipCode(churchData.address.zipCode);
        setEmail(churchData.contactInfo.email);
        setPhone(churchData.contactInfo.phone);
        setWebsite(churchData.contactInfo.website || '');
        setRooms(churchData.rooms || []);
        setCustomFields(churchData.customFields || []);

        // Check user's role
        const membership = await getChurchMembership(churchId);

        if (!isMounted) return;

        if (membership) {
          setIsAdmin(membership.role === 'admin');
          setIsLeader(membership.role === 'admin' || membership.role === 'leader');
        }
      } catch (err: any) {
        console.error('Error loading church:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load church');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChurchData();

    return () => {
      isMounted = false;
    };
  }, [churchId, authLoading, user, locale, router]);

  const copyInviteCode = async () => {
    if (church?.inviteCode) {
      await navigator.clipboard.writeText(church.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert(locale === 'pl' ? 'Tylko administratorzy mogą edytować ustawienia' : 'Only admins can edit settings');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Clean up rooms data
      const cleanedRooms = rooms.length > 0 ? rooms.map(room => {
        const cleaned: any = {
          id: room.id,
          name: room.name,
        };
        if (room.capacity !== undefined && room.capacity !== null) {
          cleaned.capacity = room.capacity;
        }
        if (room.description !== undefined && room.description !== null && room.description !== '') {
          cleaned.description = room.description;
        }
        if (room.isDefault === true) {
          cleaned.isDefault = true;
        }
        return cleaned;
      }) : undefined;

      // Build update object without undefined values
      const updateData: any = {
        name,
        address: {
          street,
          city,
          state,
          zipCode,
          country: 'PL',
        },
        contactInfo: {
          email,
          phone,
        },
      };

      // Only include optional fields if they have values
      if (denomination) {
        updateData.denomination = denomination;
      }
      if (description) {
        updateData.description = description;
      }
      if (website) {
        updateData.contactInfo.website = website;
      }
      if (cleanedRooms) {
        updateData.rooms = cleanedRooms;
      }

      await updateChurch(churchId, updateData);

      // Reload church data
      const updatedChurch = await getChurch(churchId);
      setChurch(updatedChurch);

      alert(locale === 'pl' ? 'Ustawienia zapisane pomyślnie!' : 'Settings saved successfully!');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || (locale === 'pl' ? 'Nie udało się zapisać ustawień' : 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const addRoom = () => {
    const newRoom: ChurchRoom = {
      id: Date.now().toString(),
      name: '',
      capacity: undefined,
      description: '',
    };
    setRooms([...rooms, newRoom]);
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };

  const updateRoom = (id: string, field: keyof ChurchRoom, value: string | number | boolean | undefined) => {
    setRooms(rooms.map((room) =>
      room.id === id ? { ...room, [field]: value } : room
    ));
  };

  const setDefaultRoom = (id: string) => {
    setRooms(rooms.map((room) => ({
      ...room,
      isDefault: room.id === id,
    })));
  };

  // Custom field management functions
  const openFieldDialog = (field?: CustomField) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        name: field.name,
        type: field.type,
        required: field.required || false,
        options: field.options || [],
      });
    } else {
      setEditingField(null);
      setFieldForm({
        name: '',
        type: 'text',
        required: false,
        options: [],
      });
    }
    setShowFieldDialog(true);
  };

  const handleSaveField = async () => {
    if (!fieldForm.name.trim()) {
      alert(locale === 'pl' ? 'Nazwa pola jest wymagana' : 'Field name is required');
      return;
    }

    if ((fieldForm.type === 'select' || fieldForm.type === 'multiselect') && fieldForm.options.length === 0) {
      alert(locale === 'pl' ? 'Pole wyboru musi mieć przynajmniej jedną opcję' : 'Select field must have at least one option');
      return;
    }

    let updatedFields: CustomField[];
    if (editingField) {
      // Update existing field
      updatedFields = customFields.map((field) => {
        if (field.id === editingField.id) {
          const updatedField: any = {
            ...field,
            name: fieldForm.name,
            type: fieldForm.type,
            required: fieldForm.required,
          };
          // Only include options for select and multiselect types
          if (fieldForm.type === 'select' || fieldForm.type === 'multiselect') {
            updatedField.options = fieldForm.options;
          } else {
            // Remove options field for non-select types
            delete updatedField.options;
          }
          return updatedField;
        }
        return field;
      });
    } else {
      // Add new field
      const newField: any = {
        id: Date.now().toString(),
        name: fieldForm.name,
        type: fieldForm.type,
        required: fieldForm.required,
        order: customFields.length,
      };
      // Only include options for select and multiselect types
      if (fieldForm.type === 'select' || fieldForm.type === 'multiselect') {
        newField.options = fieldForm.options;
      }
      updatedFields = [...customFields, newField as CustomField];
    }

    // Save to Firestore
    try {
      setSaving(true);
      await updateChurch(churchId, { customFields: updatedFields });
      setCustomFields(updatedFields);
      setShowFieldDialog(false);
      setEditingField(null);
    } catch (err: any) {
      console.error('Error saving custom field:', err);
      alert(locale === 'pl' ? 'Nie udało się zapisać pola' : 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm(locale === 'pl' ? 'Czy na pewno chcesz usunąć to pole?' : 'Are you sure you want to delete this field?')) {
      return;
    }

    const updatedFields = customFields.filter((field) => field.id !== fieldId);

    try {
      setSaving(true);
      await updateChurch(churchId, { customFields: updatedFields });
      setCustomFields(updatedFields);
    } catch (err: any) {
      console.error('Error deleting custom field:', err);
      alert(locale === 'pl' ? 'Nie udało się usunąć pola' : 'Failed to delete field');
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    setFieldForm((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFieldForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const removeOption = (index: number) => {
    setFieldForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {locale === 'pl' ? 'Ładowanie...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !church) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">
            {locale === 'pl' ? 'Błąd' : 'Error'}
          </p>
          <p className="text-sm mt-1">{error || (locale === 'pl' ? 'Kościół nie znaleziony' : 'Church not found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChurchIcon className="h-8 w-8" />
          {church.name}
        </h1>
        {church.denomination && (
          <p className="text-muted-foreground mt-1">{church.denomination}</p>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            {locale === 'pl' ? 'Przegląd' : 'Overview'}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="edit">
              {locale === 'pl' ? 'Edytuj' : 'Edit'}
            </TabsTrigger>
          )}
          {isLeader && (
            <TabsTrigger value="invite">
              {locale === 'pl' ? 'Zaproś' : 'Invite'}
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="fields">
              {locale === 'pl' ? 'Pola' : 'Fields'}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === 'pl' ? 'Informacje o kościele' : 'Church Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {church.description && (
                <div>
                  <h3 className="font-medium mb-2">
                    {locale === 'pl' ? 'O nas' : 'About'}
                  </h3>
                  <p className="text-muted-foreground">{church.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">
                  {locale === 'pl' ? 'Adres' : 'Address'}
                </h3>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <div>
                    <p>{church.address.street}</p>
                    <p>
                      {church.address.city}, {church.address.state} {church.address.zipCode}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">
                  {locale === 'pl' ? 'Informacje kontaktowe' : 'Contact Information'}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${church.contactInfo.email}`} className="hover:underline">
                      {church.contactInfo.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${church.contactInfo.phone}`} className="hover:underline">
                      {church.contactInfo.phone}
                    </a>
                  </div>
                  {church.contactInfo.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={church.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {church.contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab - Only visible to admins */}
        {isAdmin && (
          <TabsContent value="edit">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'pl' ? 'Podstawowe informacje' : 'Basic Information'}</CardTitle>
                  <CardDescription>
                    {locale === 'pl' ? 'Podstawowe dane o kościele' : 'Basic information about your church'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{locale === 'pl' ? 'Nazwa kościoła' : 'Church Name'} *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="denomination">{locale === 'pl' ? 'Denominacja' : 'Denomination'}</Label>
                    <Select value={denomination} onValueChange={setDenomination} disabled={saving}>
                      <SelectTrigger id="denomination">
                        <SelectValue placeholder={locale === 'pl' ? 'Wybierz denominację...' : 'Select denomination...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kościół baptystyczny">Kościół baptystyczny</SelectItem>
                        <SelectItem value="kościół zielonoświątkowy">Kościół zielonoświątkowy</SelectItem>
                        <SelectItem value="kościół katolicki">Kościół katolicki</SelectItem>
                        <SelectItem value="kościół metodystyczny">Kościół metodystyczny</SelectItem>
                        <SelectItem value="kościół niedenominacyjny">Kościół niedenominacyjny</SelectItem>
                        <SelectItem value="inny">Inny</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{locale === 'pl' ? 'Opis' : 'Description'}</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      disabled={saving}
                      placeholder={locale === 'pl' ? 'Opowiedz o swoim kościele...' : 'Tell us about your church...'}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'pl' ? 'Adres' : 'Address'}</CardTitle>
                  <CardDescription>
                    {locale === 'pl' ? 'Lokalizacja kościoła' : 'Church location'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">{locale === 'pl' ? 'Ulica' : 'Street'} *</Label>
                    <Input
                      id="street"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{locale === 'pl' ? 'Miasto' : 'City'} *</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{locale === 'pl' ? 'Kod pocztowy' : 'Zip Code'} *</Label>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">{locale === 'pl' ? 'Województwo' : 'State'} *</Label>
                    <Select value={state} onValueChange={setState} disabled={saving}>
                      <SelectTrigger id="state">
                        <SelectValue placeholder={locale === 'pl' ? 'Wybierz województwo...' : 'Select state...'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dolnośląskie">Dolnośląskie</SelectItem>
                        <SelectItem value="Kujawsko-pomorskie">Kujawsko-pomorskie</SelectItem>
                        <SelectItem value="Lubelskie">Lubelskie</SelectItem>
                        <SelectItem value="Lubuskie">Lubuskie</SelectItem>
                        <SelectItem value="Łódzkie">Łódzkie</SelectItem>
                        <SelectItem value="Małopolskie">Małopolskie</SelectItem>
                        <SelectItem value="Mazowieckie">Mazowieckie</SelectItem>
                        <SelectItem value="Opolskie">Opolskie</SelectItem>
                        <SelectItem value="Podkarpackie">Podkarpackie</SelectItem>
                        <SelectItem value="Podlaskie">Podlaskie</SelectItem>
                        <SelectItem value="Pomorskie">Pomorskie</SelectItem>
                        <SelectItem value="Śląskie">Śląskie</SelectItem>
                        <SelectItem value="Świętokrzyskie">Świętokrzyskie</SelectItem>
                        <SelectItem value="Warmińsko-mazurskie">Warmińsko-mazurskie</SelectItem>
                        <SelectItem value="Wielkopolskie">Wielkopolskie</SelectItem>
                        <SelectItem value="Zachodniopomorskie">Zachodniopomorskie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'pl' ? 'Informacje kontaktowe' : 'Contact Information'}</CardTitle>
                  <CardDescription>
                    {locale === 'pl' ? 'Jak ludzie mogą skontaktować się z kościołem' : 'How people can contact your church'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{locale === 'pl' ? 'Email' : 'Email'} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{locale === 'pl' ? 'Telefon' : 'Phone'} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">{locale === 'pl' ? 'Strona internetowa' : 'Website'}</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={saving}
                      placeholder="https://"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Rooms Management */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'pl' ? 'Sale i pomieszczenia' : 'Rooms & Spaces'}</CardTitle>
                  <CardDescription>
                    {locale === 'pl'
                      ? 'Zarządzaj pomieszczeniami dostępnymi w kościele'
                      : 'Manage available rooms and spaces in your church'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'pl'
                        ? 'Brak zdefiniowanych pomieszczeń. Dodaj pierwsze pomieszczenie aby mogło być używane podczas tworzenia wydarzeń.'
                        : 'No rooms defined. Add your first room to use when creating events.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {rooms.map((room) => (
                        <div key={room.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label htmlFor={`room-name-${room.id}`}>
                                    {locale === 'pl' ? 'Nazwa pomieszczenia' : 'Room Name'} *
                                  </Label>
                                  <Input
                                    id={`room-name-${room.id}`}
                                    value={room.name}
                                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                    placeholder={locale === 'pl' ? 'Np. Główna świątynia' : 'e.g. Main Sanctuary'}
                                    disabled={saving}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`room-capacity-${room.id}`}>
                                    {locale === 'pl' ? 'Pojemność' : 'Capacity'}
                                  </Label>
                                  <Input
                                    id={`room-capacity-${room.id}`}
                                    type="number"
                                    value={room.capacity || ''}
                                    onChange={(e) => updateRoom(room.id, 'capacity', e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="100"
                                    disabled={saving}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`room-description-${room.id}`}>
                                  {locale === 'pl' ? 'Opis' : 'Description'}
                                </Label>
                                <Input
                                  id={`room-description-${room.id}`}
                                  value={room.description || ''}
                                  onChange={(e) => updateRoom(room.id, 'description', e.target.value)}
                                  placeholder={locale === 'pl' ? 'Dodatkowe informacje o pomieszczeniu' : 'Additional room info'}
                                  disabled={saving}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  id={`room-default-${room.id}`}
                                  name="default-room"
                                  checked={room.isDefault === true}
                                  onChange={() => setDefaultRoom(room.id)}
                                  disabled={saving}
                                  className="h-4 w-4 text-primary focus:ring-primary"
                                />
                                <Label htmlFor={`room-default-${room.id}`} className="font-normal cursor-pointer">
                                  {locale === 'pl' ? 'Ustaw jako domyślne pomieszczenie' : 'Set as default room'}
                                </Label>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRoom(room.id)}
                              disabled={saving}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRoom}
                    disabled={saving}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {locale === 'pl' ? 'Dodaj pomieszczenie' : 'Add Room'}
                  </Button>
                </CardContent>
              </Card>

              {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving
                    ? (locale === 'pl' ? 'Zapisywanie...' : 'Saving...')
                    : (locale === 'pl' ? 'Zapisz zmiany' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </TabsContent>
        )}

        {/* Invite Tab - Only visible to leaders and admins */}
        {isLeader && (
          <TabsContent value="invite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {locale === 'pl' ? 'Kod zaproszenia' : 'Invite Code'}
                </CardTitle>
                <CardDescription>
                  {locale === 'pl'
                    ? 'Udostępnij ten kod innym, aby zaprosić ich do swojego kościoła'
                    : 'Share this code with others to invite them to your church'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-center h-16 bg-muted rounded-lg">
                      <p className="text-3xl font-mono font-bold tracking-wider">
                        {church.inviteCode}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={copyInviteCode}
                    className="h-16"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {locale === 'pl' ? 'Skopiowano!' : 'Copied!'}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {locale === 'pl' ? 'Kopiuj kod' : 'Copy Code'}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  {locale === 'pl'
                    ? 'Każdy, kto posiada ten kod, może dołączyć do Twojego kościoła jako członek. Zachowaj go w bezpiecznym miejscu i udostępniaj tylko zaufanym osobom.'
                    : 'Anyone with this code can join your church as a member. Keep it secure and only share with trusted individuals.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Custom Fields Tab - Only visible to admins */}
        {isAdmin && (
          <TabsContent value="fields" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  {locale === 'pl' ? 'Pola niestandardowe' : 'Custom Fields'}
                </CardTitle>
                <CardDescription>
                  {locale === 'pl'
                    ? 'Utwórz dodatkowe pola do przechowywania informacji o członkach kościoła'
                    : 'Create additional fields to store information about church members'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {locale === 'pl'
                      ? 'Brak zdefiniowanych pól. Dodaj pierwsze pole, aby móc przechowywać dodatkowe informacje o członkach.'
                      : 'No custom fields defined. Add your first field to store additional member information.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div key={field.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-medium">{field.name}</h4>
                                {field.required && (
                                  <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded">
                                    {locale === 'pl' ? 'Wymagane' : 'Required'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>
                                  {locale === 'pl' ? 'Typ' : 'Type'}:{' '}
                                  <span className="font-medium">
                                    {field.type === 'text' && (locale === 'pl' ? 'Tekst' : 'Text')}
                                    {field.type === 'number' && (locale === 'pl' ? 'Liczba' : 'Number')}
                                    {field.type === 'date' && (locale === 'pl' ? 'Data' : 'Date')}
                                    {field.type === 'select' && (locale === 'pl' ? 'Wybór' : 'Select')}
                                    {field.type === 'multiselect' && (locale === 'pl' ? 'Wiele opcji' : 'Multi-select')}
                                    {field.type === 'boolean' && (locale === 'pl' ? 'Tak/Nie' : 'Yes/No')}
                                  </span>
                                </span>
                                {(field.type === 'select' || field.type === 'multiselect') && field.options && (
                                  <span>
                                    {locale === 'pl' ? 'Opcje' : 'Options'}: {field.options.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openFieldDialog(field)}
                                disabled={saving}
                              >
                                {locale === 'pl' ? 'Edytuj' : 'Edit'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteField(field.id)}
                                disabled={saving}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openFieldDialog()}
                  disabled={saving}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {locale === 'pl' ? 'Dodaj pole' : 'Add Field'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Custom Field Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingField
                ? (locale === 'pl' ? 'Edytuj pole' : 'Edit Field')
                : (locale === 'pl' ? 'Dodaj pole' : 'Add Field')}
            </DialogTitle>
            <DialogDescription>
              {locale === 'pl'
                ? 'Utwórz pole niestandardowe do przechowywania dodatkowych informacji o członkach'
                : 'Create a custom field to store additional member information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">
                {locale === 'pl' ? 'Nazwa pola' : 'Field Name'} *
              </Label>
              <Input
                id="field-name"
                value={fieldForm.name}
                onChange={(e) => setFieldForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={locale === 'pl' ? 'Np. Data chrztu' : 'e.g. Baptism Date'}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-type">
                {locale === 'pl' ? 'Typ pola' : 'Field Type'} *
              </Label>
              <Select
                value={fieldForm.type}
                onValueChange={(value: CustomFieldType) =>
                  setFieldForm((prev) => ({ ...prev, type: value, options: (value === 'select' || value === 'multiselect') ? prev.options : [] }))
                }
                disabled={saving}
              >
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{locale === 'pl' ? 'Tekst' : 'Text'}</SelectItem>
                  <SelectItem value="number">{locale === 'pl' ? 'Liczba' : 'Number'}</SelectItem>
                  <SelectItem value="date">{locale === 'pl' ? 'Data' : 'Date'}</SelectItem>
                  <SelectItem value="select">{locale === 'pl' ? 'Wybór' : 'Select'}</SelectItem>
                  <SelectItem value="multiselect">{locale === 'pl' ? 'Wiele opcji' : 'Multi-select'}</SelectItem>
                  <SelectItem value="boolean">{locale === 'pl' ? 'Tak/Nie' : 'Yes/No'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(fieldForm.type === 'select' || fieldForm.type === 'multiselect') && (
              <div className="space-y-2">
                <Label>
                  {locale === 'pl' ? 'Opcje wyboru' : 'Options'} *
                </Label>
                <div className="space-y-2">
                  {fieldForm.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={locale === 'pl' ? `Opcja ${index + 1}` : `Option ${index + 1}`}
                        disabled={saving}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={saving}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    {locale === 'pl' ? 'Dodaj opcję' : 'Add Option'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-required"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm((prev) => ({ ...prev, required: e.target.checked }))}
                disabled={saving}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              <Label htmlFor="field-required" className="font-normal cursor-pointer">
                {locale === 'pl' ? 'To pole jest wymagane' : 'This field is required'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFieldDialog(false)}
              disabled={saving}
            >
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveField} disabled={saving}>
              {saving
                ? (locale === 'pl' ? 'Zapisywanie...' : 'Saving...')
                : (locale === 'pl' ? 'Zapisz' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
