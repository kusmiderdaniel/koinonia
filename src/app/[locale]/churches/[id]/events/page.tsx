'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import { getChurch, getChurchMembership, getChurchMembersWithUsers } from '@/lib/services/church';
import {
  getChurchEvents,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  reorderAgendaItems,
  assignVolunteerToRole,
  removeVolunteerFromRole,
  updateVolunteerAssignmentStatus,
} from '@/lib/services/event';
import { getChurchSongs } from '@/lib/services/song';
import {
  getAgendaTemplates,
  createAgendaTemplate,
  deleteAgendaTemplate,
  type AgendaItemTemplate,
} from '@/lib/services/agendaTemplate';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Users,
  FileText,
  ChevronRight,
  Edit,
  Trash2,
  GripVertical,
  Music,
  Search,
} from 'lucide-react';
import type { Church } from '@/types/church';
import type { Event, EventAgendaItem } from '@/types/event';
import type { Song } from '@/types/song';
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
  const [actionLoading, setActionLoading] = useState(false);

  // Additional data for agenda and volunteer features
  const [churchMembers, setChurchMembers] = useState<any[]>([]);
  const [churchSongs, setChurchSongs] = useState<Song[]>([]);
  const [agendaTemplates, setAgendaTemplates] = useState<AgendaItemTemplate[]>([]);

  // Agenda item management
  const [showAgendaDialog, setShowAgendaDialog] = useState(false);
  const [showAgendaFormDialog, setShowAgendaFormDialog] = useState(false);
  const [editingAgendaItem, setEditingAgendaItem] = useState<EventAgendaItem | null>(null);
  const [agendaForm, setAgendaForm] = useState({
    title: '',
    description: '',
    duration: '',
    songId: '',
    songKey: '',
    songTempo: '' as '' | 'slow' | 'medium' | 'fast',
    songLeader: '',
  });
  const [songSearchTerm, setSongSearchTerm] = useState('');

  // Song customization dialog
  const [showSongCustomDialog, setShowSongCustomDialog] = useState(false);
  const [selectedSongForCustom, setSelectedSongForCustom] = useState<Song | null>(null);
  const [songCustomForm, setSongCustomForm] = useState({
    key: '',
    leader: '',
    duration: '',
  });

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Volunteer management
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');

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

        const [churchData, membership, eventsData, members, songs, templates] = await Promise.all([
          getChurch(churchId),
          getChurchMembership(churchId),
          getChurchEvents(churchId),
          getChurchMembersWithUsers(churchId),
          getChurchSongs(churchId),
          getAgendaTemplates(churchId),
        ]);

        if (!isMounted) return;

        setChurch(churchData);
        setUserRole(membership?.role || null);
        setEvents(eventsData);
        setChurchMembers(members);
        setChurchSongs(songs);
        setAgendaTemplates(templates);
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

  // Helper functions for agenda items
  const getTempoLabel = (tempo: string) => {
    const labels: Record<string, { pl: string; en: string }> = {
      slow: { pl: 'Wolne', en: 'Slow' },
      medium: { pl: 'Średnie', en: 'Medium' },
      fast: { pl: 'Szybkie', en: 'Fast' },
    };
    const label = labels[tempo] || labels.medium;
    return locale === 'pl' ? label.pl : label.en;
  };

  const secondsToMMSS = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const mmssToSeconds = (mmss: string): number | undefined => {
    if (!mmss) return undefined;
    const parts = mmss.split(':');
    if (parts.length !== 2) return undefined;
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
  };

  const getVolunteerStatusLabel = (status: string) => {
    const labels: Record<string, { pl: string; en: string }> = {
      invited: { pl: 'Zaproszony', en: 'Invited' },
      accepted: { pl: 'Zaakceptowany', en: 'Accepted' },
      declined: { pl: 'Odrzucony', en: 'Declined' },
      confirmed: { pl: 'Potwierdzony', en: 'Confirmed' },
      no_show: { pl: 'Nie pojawił się', en: 'No Show' },
    };
    const label = labels[status] || labels.invited;
    return locale === 'pl' ? label.pl : label.en;
  };

  const getVolunteerStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      confirmed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      no_show: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[status] || colors.invited;
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reload selected event data
  const reloadSelectedEvent = async () => {
    if (!selectedEvent) return;
    const updatedEvents = await getChurchEvents(churchId);
    setEvents(updatedEvents);
    const updated = updatedEvents.find(e => e.id === selectedEvent.id);
    if (updated) setSelectedEvent(updated);
  };

  // Agenda handlers
  const openAgendaDialog = (item?: EventAgendaItem) => {
    if (item) {
      setEditingAgendaItem(item);
      const selectedSong = item.songId ? churchSongs.find(s => s.id === item.songId) : null;
      setAgendaForm({
        title: item.title,
        description: item.description || '',
        duration: secondsToMMSS(item.duration),
        songId: item.songId || '',
        songKey: item.songKey || (selectedSong?.key || ''),
        songTempo: item.songTempo || (selectedSong?.tempo || ''),
        songLeader: item.songLeader || '',
      });
      setShowAgendaFormDialog(true);
    } else {
      setEditingAgendaItem(null);
      setShowAgendaDialog(true);
    }
  };

  const openNewAgendaForm = () => {
    setEditingAgendaItem(null);
    setAgendaForm({ title: '', description: '', duration: '', songId: '', songKey: '', songTempo: '', songLeader: '' });
    setShowAgendaDialog(false);
    setShowAgendaFormDialog(true);
  };

  const handleSelectTemplate = async (template: AgendaItemTemplate) => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const itemData = {
        title: template.title,
        description: template.description,
        duration: template.duration,
        songId: undefined,
        songKey: undefined,
        songTempo: undefined,
      };
      await addAgendaItem(churchId, selectedEvent.id, itemData);
      await reloadSelectedEvent();
      setShowAgendaDialog(false);
    } catch (err: any) {
      console.error('Error adding agenda item:', err);
      setError(err.message || 'Failed to add agenda item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm(locale === 'pl' ? 'Czy na pewno chcesz usunąć ten szablon?' : 'Are you sure you want to delete this template?')) {
      return;
    }
    try {
      setActionLoading(true);
      await deleteAgendaTemplate(churchId, templateId);
      const updatedTemplates = await getAgendaTemplates(churchId);
      setAgendaTemplates(updatedTemplates);
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSongForCustom(song);
    setSongCustomForm({
      key: song.key,
      leader: '',
      duration: secondsToMMSS(song.duration),
    });
    setShowAgendaDialog(false);
    setShowSongCustomDialog(true);
  };

  const handleSaveSongToAgenda = async () => {
    if (!selectedSongForCustom || !selectedEvent) return;
    try {
      setActionLoading(true);
      const itemData = {
        title: selectedSongForCustom.title,
        description: undefined,
        duration: mmssToSeconds(songCustomForm.duration),
        songId: selectedSongForCustom.id,
        songKey: songCustomForm.key || selectedSongForCustom.key,
        songTempo: selectedSongForCustom.tempo,
        songLeader: songCustomForm.leader || undefined,
      };
      await addAgendaItem(churchId, selectedEvent.id, itemData);
      await reloadSelectedEvent();
      setShowSongCustomDialog(false);
      setSelectedSongForCustom(null);
      setSongCustomForm({ key: '', leader: '', duration: '' });
    } catch (err: any) {
      console.error('Error adding song:', err);
      setError(err.message || 'Failed to add song');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAgendaItem = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      if (editingAgendaItem) {
        const itemData = {
          title: agendaForm.title,
          description: agendaForm.description || undefined,
          duration: mmssToSeconds(agendaForm.duration),
          songId: editingAgendaItem.songId,
          songKey: editingAgendaItem.songId ? (agendaForm.songKey || undefined) : undefined,
          songTempo: editingAgendaItem.songTempo,
          songLeader: editingAgendaItem.songId ? (agendaForm.songLeader || undefined) : undefined,
        };
        await updateAgendaItem(churchId, selectedEvent.id, editingAgendaItem.id, itemData);
        await reloadSelectedEvent();
        setShowAgendaFormDialog(false);
      } else {
        const templateData = {
          title: agendaForm.title,
          description: agendaForm.description || undefined,
          duration: mmssToSeconds(agendaForm.duration),
        };
        await createAgendaTemplate(churchId, templateData);
        const updatedTemplates = await getAgendaTemplates(churchId);
        setAgendaTemplates(updatedTemplates);
        setShowAgendaFormDialog(false);
        setShowAgendaDialog(true);
      }
      setAgendaForm({ title: '', description: '', duration: '', songId: '', songKey: '', songTempo: '', songLeader: '' });
      setEditingAgendaItem(null);
    } catch (err: any) {
      console.error('Error saving agenda item:', err);
      setError(err.message || 'Failed to save agenda item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAgendaItem = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAgendaItem = async () => {
    if (!itemToDelete || !selectedEvent) return;
    try {
      setActionLoading(true);
      await deleteAgendaItem(churchId, selectedEvent.id, itemToDelete);
      await reloadSelectedEvent();
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Error deleting agenda item:', err);
      setError(err.message || 'Failed to delete agenda item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDragEnd = async (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;
    if (!over || !selectedEvent || !selectedEvent.agenda) return;
    if (active.id === over.id) return;

    const oldIndex = selectedEvent.agenda.findIndex((item) => item.id === active.id);
    const newIndex = selectedEvent.agenda.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...selectedEvent.agenda], oldIndex, newIndex);
    try {
      setActionLoading(true);
      await reorderAgendaItems(churchId, selectedEvent.id, reordered);
      await reloadSelectedEvent();
    } catch (err: any) {
      console.error('Error reordering agenda items:', err);
      setError(err.message || 'Failed to reorder agenda items');
    } finally {
      setActionLoading(false);
    }
  };

  // Volunteer handlers
  const openAssignDialog = (roleId: string) => {
    setSelectedRoleForAssignment(roleId);
    setSelectedVolunteerId('');
    setShowAssignDialog(true);
  };

  const handleAssignVolunteer = async () => {
    if (!selectedRoleForAssignment || !selectedVolunteerId || !selectedEvent) return;
    try {
      setActionLoading(true);
      await assignVolunteerToRole(churchId, selectedEvent.id, selectedRoleForAssignment, selectedVolunteerId);
      await reloadSelectedEvent();
      setShowAssignDialog(false);
      setSelectedRoleForAssignment(null);
      setSelectedVolunteerId('');
    } catch (err: any) {
      console.error('Error assigning volunteer:', err);
      setError(err.message || 'Failed to assign volunteer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveVolunteer = async (roleId: string, volunteerId: string) => {
    if (!confirm(locale === 'pl' ? 'Czy na pewno chcesz usunąć tego wolontariusza?' : 'Are you sure you want to remove this volunteer?') || !selectedEvent) {
      return;
    }
    try {
      setActionLoading(true);
      await removeVolunteerFromRole(churchId, selectedEvent.id, roleId, volunteerId);
      await reloadSelectedEvent();
    } catch (err: any) {
      console.error('Error removing volunteer:', err);
      setError(err.message || 'Failed to remove volunteer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateVolunteerStatus = async (
    roleId: string,
    volunteerId: string,
    status: 'invited' | 'accepted' | 'declined' | 'confirmed' | 'no_show'
  ) => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      await updateVolunteerAssignmentStatus(churchId, selectedEvent.id, roleId, volunteerId, status);
      await reloadSelectedEvent();
    } catch (err: any) {
      console.error('Error updating volunteer status:', err);
      setError(err.message || 'Failed to update volunteer status');
    } finally {
      setActionLoading(false);
    }
  };

  // Sortable Agenda Item Component
  const SortableAgendaItem = ({ item, index }: { item: EventAgendaItem; index: number }) => {
    const itemSong = item.songId ? churchSongs.find((s) => s.id === item.songId) : null;
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
      >
        {isLeader && (
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground pt-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{item.title}</h4>
            {(item.duration || itemSong?.duration) && (
              <span className="text-xs text-muted-foreground">
                {secondsToMMSS(item.duration || itemSong?.duration)}
              </span>
            )}
          </div>
          {itemSong && (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Music className="h-3 w-3" />
                <span>{itemSong.artist}</span>
                {(item.songKey || itemSong.key) && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <span>Key: {item.songKey || itemSong.key}</span>
                  </>
                )}
                {(item.songTempo || itemSong.tempo) && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <span>{getTempoLabel(item.songTempo || itemSong.tempo)}</span>
                  </>
                )}
              </div>
              {item.songLeader && (
                <div className="text-xs">
                  {locale === 'pl' ? 'Prowadzący' : 'Leader'}: {item.songLeader}
                </div>
              )}
            </div>
          )}
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
        {isLeader && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAgendaDialog(item)}
              disabled={actionLoading}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAgendaItem(item.id)}
              disabled={actionLoading}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    );
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
          {selectedEvent && (
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
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
                  {isLeader && (
                    <Link href={`/${locale}/churches/${churchId}/events/${selectedEvent.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 h-3 w-3" />
                        {locale === 'pl' ? 'Edytuj' : 'Edit'}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>

              <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-6 flex-shrink-0">
                  <TabsTrigger value="details">
                    {locale === 'pl' ? 'Szczegóły' : 'Details'}
                  </TabsTrigger>
                  <TabsTrigger value="agenda">
                    {locale === 'pl' ? 'Agenda' : 'Agenda'}
                  </TabsTrigger>
                  <TabsTrigger value="volunteers">
                    {locale === 'pl' ? 'Wolontariusze' : 'Volunteers'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="flex-1 overflow-y-auto mx-6 mb-6 space-y-6 mt-6">
                  {selectedEvent.description && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {locale === 'pl' ? 'Opis' : 'Description'}
                      </h3>
                      <p className="text-sm leading-relaxed">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="flex items-start gap-4 pb-5 border-b">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {locale === 'pl' ? 'Data' : 'Date'}
                        </h3>
                        <p className="text-base font-medium">
                          {safeFormatDate(selectedEvent.datetime.start, 'PPP')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pb-5 border-b">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {locale === 'pl' ? 'Godzina' : 'Time'}
                        </h3>
                        <p className="text-base font-medium">
                          {safeFormatDate(selectedEvent.datetime.start, 'p')}
                          {' - '}
                          {safeFormatDate(selectedEvent.datetime.end, 'p')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pb-5 border-b">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {locale === 'pl' ? 'Lokalizacja' : 'Location'}
                        </h3>
                        <p className="text-base font-medium">{selectedEvent.location.name}</p>
                        {selectedEvent.location.address && (
                          <p className="text-sm text-muted-foreground mt-1">{selectedEvent.location.address}</p>
                        )}
                        {selectedEvent.location.room && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {locale === 'pl' ? 'Sala' : 'Room'}: {selectedEvent.location.room}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="agenda" className="flex-1 overflow-y-auto mx-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">
                      {locale === 'pl' ? 'Agenda wydarzenia' : 'Event Agenda'}
                    </h3>
                    {isLeader && (
                      <Button size="sm" onClick={() => openAgendaDialog()} disabled={actionLoading}>
                        <Plus className="mr-1 h-3 w-3" />
                        {locale === 'pl' ? 'Dodaj' : 'Add'}
                      </Button>
                    )}
                  </div>

                  {selectedEvent.agenda && selectedEvent.agenda.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={selectedEvent.agenda.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {selectedEvent.agenda
                            .sort((a, b) => a.order - b.order)
                            .map((item, index) => (
                              <SortableAgendaItem key={item.id} item={item} index={index} />
                            ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        {locale === 'pl'
                          ? 'Brak elementów w agendzie'
                          : 'No agenda items yet'}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="volunteers" className="flex-1 overflow-y-auto mx-6 mb-6">
                  {selectedEvent.roles && selectedEvent.roles.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEvent.roles.map((role) => {
                        const assignedVolunteers = role.assignments || [];
                        const availableSlots = role.requiredCount - assignedVolunteers.length;

                        return (
                          <Card key={role.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {role.name}
                                  </CardTitle>
                                  <CardDescription className="text-xs">{role.description}</CardDescription>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-muted-foreground">
                                      {locale === 'pl' ? 'Przypisano' : 'Assigned'}: {assignedVolunteers.length} / {role.requiredCount}
                                    </span>
                                    {availableSlots > 0 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                        {availableSlots} {locale === 'pl' ? 'wolnych' : 'available'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isLeader && availableSlots > 0 && (
                                  <Button size="sm" onClick={() => openAssignDialog(role.id)} disabled={actionLoading}>
                                    <Plus className="mr-1 h-3 w-3" />
                                    {locale === 'pl' ? 'Przypisz' : 'Assign'}
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {assignedVolunteers.length > 0 ? (
                                <div className="space-y-2">
                                  {assignedVolunteers.map((assignment) => {
                                    const volunteer = churchMembers.find((m) => m.userId === assignment.userId);
                                    if (!volunteer) return null;

                                    return (
                                      <div
                                        key={assignment.userId}
                                        className="flex items-center justify-between p-2 border rounded-lg text-sm"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-medium">
                                              {volunteer.firstName?.[0]}{volunteer.lastName?.[0]}
                                            </span>
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-xs truncate">
                                              {volunteer.firstName} {volunteer.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{volunteer.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {isLeader ? (
                                            <>
                                              <Select
                                                value={assignment.status}
                                                onValueChange={(value) =>
                                                  handleUpdateVolunteerStatus(
                                                    role.id,
                                                    assignment.userId,
                                                    value as any
                                                  )
                                                }
                                                disabled={actionLoading}
                                              >
                                                <SelectTrigger className="w-[100px] h-7 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="invited">
                                                    {getVolunteerStatusLabel('invited')}
                                                  </SelectItem>
                                                  <SelectItem value="accepted">
                                                    {getVolunteerStatusLabel('accepted')}
                                                  </SelectItem>
                                                  <SelectItem value="declined">
                                                    {getVolunteerStatusLabel('declined')}
                                                  </SelectItem>
                                                  <SelectItem value="confirmed">
                                                    {getVolunteerStatusLabel('confirmed')}
                                                  </SelectItem>
                                                  <SelectItem value="no_show">
                                                    {getVolunteerStatusLabel('no_show')}
                                                  </SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => handleRemoveVolunteer(role.id, assignment.userId)}
                                                disabled={actionLoading}
                                              >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                              </Button>
                                            </>
                                          ) : (
                                            <span
                                              className={`text-xs px-2 py-0.5 rounded-full ${getVolunteerStatusColor(assignment.status)}`}
                                            >
                                              {getVolunteerStatusLabel(assignment.status)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-xs">
                                    {locale === 'pl'
                                      ? 'Brak przypisanych wolontariuszy'
                                      : 'No volunteers assigned yet'}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">
                        {locale === 'pl'
                          ? 'Brak ról wolontariuszy dla tego wydarzenia'
                          : 'No volunteer roles defined for this event'}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>

      {/* Agenda Selection Dialog */}
      <Dialog open={showAgendaDialog} onOpenChange={setShowAgendaDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {locale === 'pl' ? 'Dodaj element agendy' : 'Add Agenda Item'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'pl'
                ? 'Wybierz szablon, piosenkę lub utwórz nowy szablon'
                : 'Choose a template, song, or create a new template'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">
                {locale === 'pl' ? 'Szablony' : 'Templates'}
              </TabsTrigger>
              <TabsTrigger value="songs">
                {locale === 'pl' ? 'Piosenki' : 'Songs'}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="mt-4">
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                <Button
                  variant="outline"
                  className="w-full justify-start border-2"
                  onClick={openNewAgendaForm}
                  disabled={actionLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {locale === 'pl' ? 'Utwórz nowy szablon' : 'Create New Template'}
                </Button>
                {agendaTemplates.length > 0 ? (
                  [...agendaTemplates]
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((template) => (
                      <div key={template.id} className="flex items-start gap-2 border rounded-lg p-1">
                        <Button
                          variant="ghost"
                          className="flex-1 justify-start h-auto py-3"
                          onClick={() => handleSelectTemplate(template)}
                          disabled={actionLoading}
                        >
                          <div className="text-left flex-1">
                            <div className="font-medium text-sm">{template.title}</div>
                            {template.description && (
                              <div className="text-xs text-muted-foreground">
                                {template.description}
                              </div>
                            )}
                            {template.duration && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {secondsToMMSS(template.duration)}
                              </div>
                            )}
                          </div>
                        </Button>
                        {isLeader && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            disabled={actionLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {locale === 'pl'
                        ? 'Brak szablonów. Utwórz pierwszy szablon.'
                        : 'No templates yet. Create your first template.'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="songs" className="mt-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={locale === 'pl' ? 'Szukaj po tytule lub wykonawcy...' : 'Search by title or artist...'}
                    value={songSearchTerm}
                    onChange={(e) => setSongSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-3 max-h-[45vh] overflow-y-auto">
                  {churchSongs.length > 0 ? (
                    [...churchSongs]
                      .filter((song) => {
                        if (!songSearchTerm) return true;
                        const searchLower = songSearchTerm.toLowerCase();
                        return (
                          song.title.toLowerCase().includes(searchLower) ||
                          song.artist.toLowerCase().includes(searchLower)
                        );
                      })
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((song) => (
                        <div key={song.id} className="border rounded-lg p-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-auto py-3"
                            onClick={() => handleSelectSong(song)}
                            disabled={actionLoading}
                          >
                            <div className="text-left flex-1">
                              <div className="font-medium text-sm">{song.title}</div>
                              <div className="text-xs text-muted-foreground">{song.artist}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>Key: {song.key}</span>
                                <span>|</span>
                                <span>{getTempoLabel(song.tempo)}</span>
                              </div>
                            </div>
                          </Button>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {locale === 'pl'
                          ? 'Brak piosenek w bibliotece'
                          : 'No songs in library'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Agenda Form Dialog */}
      <Dialog open={showAgendaFormDialog} onOpenChange={setShowAgendaFormDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAgendaItem
                ? locale === 'pl'
                  ? 'Edytuj element agendy'
                  : 'Edit Agenda Item'
                : locale === 'pl'
                ? 'Utwórz nowy szablon'
                : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                {locale === 'pl' ? 'Tytuł' : 'Title'} *
              </Label>
              <Input
                id="title"
                value={agendaForm.title}
                onChange={(e) =>
                  setAgendaForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder={locale === 'pl' ? 'np. Powitanie, Kazanie' : 'e.g. Welcome, Sermon'}
                disabled={!!editingAgendaItem?.songId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">
                {locale === 'pl' ? 'Czas trwania (mm:ss)' : 'Duration (mm:ss)'}
              </Label>
              <Input
                id="duration"
                value={agendaForm.duration}
                onChange={(e) =>
                  setAgendaForm((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="3:45"
              />
            </div>
            {editingAgendaItem?.songId && (
              <>
                <div className="space-y-2">
                  <Label>{locale === 'pl' ? 'Tonacja' : 'Key'}</Label>
                  <Input
                    value={agendaForm.songKey}
                    onChange={(e) =>
                      setAgendaForm((prev) => ({ ...prev, songKey: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'pl' ? 'Prowadzący' : 'Leader'}</Label>
                  <Input
                    value={agendaForm.songLeader}
                    onChange={(e) =>
                      setAgendaForm((prev) => ({ ...prev, songLeader: e.target.value }))
                    }
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">
                {locale === 'pl' ? 'Opis' : 'Description'}
              </Label>
              <Textarea
                id="description"
                value={agendaForm.description}
                onChange={(e) =>
                  setAgendaForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAgendaFormDialog(false)}
              disabled={actionLoading}
            >
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveAgendaItem}
              disabled={!agendaForm.title || actionLoading}
            >
              {actionLoading ? (locale === 'pl' ? 'Zapisywanie...' : 'Saving...') : (locale === 'pl' ? 'Zapisz' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Song Customization Dialog */}
      <Dialog open={showSongCustomDialog} onOpenChange={setShowSongCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'pl' ? 'Dodaj piosenkę' : 'Add Song'}
            </DialogTitle>
            <DialogDescription>
              {selectedSongForCustom && (
                <span>
                  {selectedSongForCustom.title} - {selectedSongForCustom.artist}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{locale === 'pl' ? 'Tonacja' : 'Key'} *</Label>
              <Input
                value={songCustomForm.key}
                onChange={(e) =>
                  setSongCustomForm((prev) => ({ ...prev, key: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'pl' ? 'Prowadzący' : 'Leader'}</Label>
              <Input
                value={songCustomForm.leader}
                onChange={(e) =>
                  setSongCustomForm((prev) => ({ ...prev, leader: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === 'pl' ? 'Czas trwania (mm:ss)' : 'Duration (mm:ss)'}</Label>
              <Input
                value={songCustomForm.duration}
                onChange={(e) =>
                  setSongCustomForm((prev) => ({ ...prev, duration: e.target.value }))
                }
                placeholder="3:45"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSongCustomDialog(false);
                setShowAgendaDialog(true);
              }}
              disabled={actionLoading}
            >
              {locale === 'pl' ? 'Wróć' : 'Back'}
            </Button>
            <Button
              onClick={handleSaveSongToAgenda}
              disabled={!songCustomForm.key || actionLoading}
            >
              {actionLoading ? (locale === 'pl' ? 'Dodawanie...' : 'Adding...') : (locale === 'pl' ? 'Dodaj' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volunteer Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'pl' ? 'Przypisz wolontariusza' : 'Assign Volunteer'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{locale === 'pl' ? 'Wolontariusz' : 'Volunteer'} *</Label>
              <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === 'pl'
                        ? 'Wybierz wolontariusza...'
                        : 'Select a volunteer...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {churchMembers
                    .filter((member) => {
                      const role = selectedEvent?.roles?.find(
                        (r) => r.id === selectedRoleForAssignment
                      );
                      return !role?.assignments?.some((a) => a.userId === member.userId);
                    })
                    .map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.firstName} {member.lastName} ({member.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
              disabled={actionLoading}
            >
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAssignVolunteer}
              disabled={!selectedVolunteerId || actionLoading}
            >
              {actionLoading ? (locale === 'pl' ? 'Przypisywanie...' : 'Assigning...') : (locale === 'pl' ? 'Przypisz' : 'Assign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'pl' ? 'Czy na pewno?' : 'Are you sure?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'pl'
                ? 'Ta akcja nie może zostać cofnięta. Element zostanie trwale usunięty z agendy.'
                : 'This action cannot be undone. This will permanently delete the item from the agenda.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {locale === 'pl' ? 'Anuluj' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAgendaItem}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (locale === 'pl' ? 'Usuwanie...' : 'Deleting...') : (locale === 'pl' ? 'Usuń' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
