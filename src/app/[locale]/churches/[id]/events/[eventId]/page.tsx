'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
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
import {
  getEvent,
  cancelEvent,
  deleteEvent,
  addAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  reorderAgendaItems,
  assignVolunteerToRole,
  removeVolunteerFromRole,
  updateVolunteerAssignmentStatus
} from '@/lib/services/event';
import { getChurchMembership, getChurchMembersWithUsers } from '@/lib/services/church';
import { getChurchSongs } from '@/lib/services/song';
import {
  getAgendaTemplates,
  createAgendaTemplate,
  deleteAgendaTemplate,
  type AgendaItemTemplate
} from '@/lib/services/agendaTemplate';
import type { Song } from '@/types/song';
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
  DialogTrigger,
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
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  XCircle,
  Users,
  Tag,
  AlertCircle,
  Plus,
  GripVertical,
  FileText,
  Music,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import type { Event, EventAgendaItem } from '@/types/event';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const churchId = params.id as string;
  const eventId = params.eventId as string;
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Songs
  const [churchSongs, setChurchSongs] = useState<Song[]>([]);

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
  const [agendaTemplates, setAgendaTemplates] = useState<AgendaItemTemplate[]>([]);
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
  const [churchMembers, setChurchMembers] = useState<any[]>([]);
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

        const [eventData, membership, members, songs, templates] = await Promise.all([
          getEvent(churchId, eventId),
          getChurchMembership(churchId),
          getChurchMembersWithUsers(churchId),
          getChurchSongs(churchId),
          getAgendaTemplates(churchId),
        ]);

        if (!isMounted) return;

        setEvent(eventData);
        setUserRole(membership?.role || null);
        setChurchMembers(members);
        setChurchSongs(songs);
        setAgendaTemplates(templates);
      } catch (err: any) {
        console.error('Error loading event:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load event');
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
  }, [churchId, eventId, authLoading, user, locale, router]);

  const isLeader = userRole === 'admin' || userRole === 'leader';

  // Handle song selection in form
  const handleSongSelect = (songId: string) => {
    if (!songId || songId === '__none__') {
      setAgendaForm((prev) => ({
        ...prev,
        songId: '',
        title: '',
        songKey: '',
        songTempo: '',
      }));
      return;
    }

    const song = churchSongs.find((s) => s.id === songId);
    if (song) {
      setAgendaForm((prev) => ({
        ...prev,
        songId: song.id,
        title: song.title,
        songKey: song.key,
        songTempo: song.tempo,
      }));
    }
  };

  const getTempoLabel = (tempo: string) => {
    const labels: Record<string, { pl: string; en: string }> = {
      slow: { pl: 'Slow', en: 'Slow' },
      medium: { pl: 'Medium', en: 'Medium' },
      fast: { pl: 'Fast', en: 'Fast' },
    };
    const label = labels[tempo] || labels.medium;
    return locale === 'pl' ? label.pl : label.en;
  };

  // Convert seconds to mm:ss format
  const secondsToMMSS = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert mm:ss format to seconds
  const mmssToSeconds = (mmss: string): number | undefined => {
    if (!mmss) return undefined;
    const parts = mmss.split(':');
    if (parts.length !== 2) return undefined;
    const mins = parseInt(parts[0]) || 0;
    const secs = parseInt(parts[1]) || 0;
    return mins * 60 + secs;
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
            <h4 className="font-medium">{item.title}</h4>
            {(item.duration || itemSong?.duration) && (
              <span className="text-xs text-muted-foreground">
                {secondsToMMSS(item.duration || itemSong?.duration)}
              </span>
            )}
          </div>
          {itemSong && (
            <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-1">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
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
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
        </div>
        {isLeader && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAgendaDialog(item)}
              disabled={actionLoading}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAgendaItem(item.id)}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const handleCancelEvent = async () => {
    if (!confirm(locale === 'pl'
      ? 'Czy na pewno chcesz anulować to wydarzenie?'
      : 'Are you sure you want to cancel this event?')) {
      return;
    }

    try {
      setActionLoading(true);
      await cancelEvent(churchId, eventId);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
    } catch (err: any) {
      console.error('Error canceling event:', err);
      setError(err.message || 'Failed to cancel event');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm(locale === 'pl'
      ? 'Czy na pewno chcesz trwale usunąć to wydarzenie? Ta akcja nie może zostać cofnięta.'
      : 'Are you sure you want to permanently delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteEvent(churchId, eventId);
      router.push(`/${locale}/churches/${churchId}/events`);
    } catch (err: any) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Failed to delete event');
      setActionLoading(false);
    }
  };

  // Agenda item handlers
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
      await addAgendaItem(churchId, eventId, itemData);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
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
    if (!selectedSongForCustom) return;

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
      await addAgendaItem(churchId, eventId, itemData);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
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
    try {
      setActionLoading(true);

      if (editingAgendaItem) {
        // Editing existing agenda item in the event
        const itemData = {
          title: agendaForm.title,
          description: agendaForm.description || undefined,
          duration: mmssToSeconds(agendaForm.duration),
          songId: editingAgendaItem.songId,
          songKey: editingAgendaItem.songId ? (agendaForm.songKey || undefined) : undefined,
          songTempo: editingAgendaItem.songTempo,
          songLeader: editingAgendaItem.songId ? (agendaForm.songLeader || undefined) : undefined,
        };
        await updateAgendaItem(churchId, eventId, editingAgendaItem.id, itemData);
        const updatedEvent = await getEvent(churchId, eventId);
        setEvent(updatedEvent);
        setShowAgendaFormDialog(false);
      } else {
        // Creating a new template
        const templateData = {
          title: agendaForm.title,
          description: agendaForm.description || undefined,
          duration: mmssToSeconds(agendaForm.duration),
        };
        await createAgendaTemplate(churchId, templateData);
        const updatedTemplates = await getAgendaTemplates(churchId);
        setAgendaTemplates(updatedTemplates);
        // Close form dialog and open main dialog to show the new template
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
    if (!itemToDelete) return;

    try {
      setActionLoading(true);
      await deleteAgendaItem(churchId, eventId, itemToDelete);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Error deleting agenda item:', err);
      setError(err.message || 'Failed to delete agenda item');
    } finally {
      setActionLoading(false);
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;

    if (!over || !event) return;
    if (active.id === over.id) return;

    if (!event || !event.agenda) return;

    const oldIndex = event.agenda.findIndex((item) => item.id === active.id);
    const newIndex = event.agenda.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove([...event.agenda], oldIndex, newIndex);

    try {
      setActionLoading(true);
      await reorderAgendaItems(churchId, eventId, reordered);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
    } catch (err: any) {
      console.error('Error reordering agenda items:', err);
      setError(err.message || 'Failed to reorder agenda items');
    } finally {
      setActionLoading(false);
    }
  };

  // Volunteer assignment handlers
  const openAssignDialog = (roleId: string) => {
    setSelectedRoleForAssignment(roleId);
    setSelectedVolunteerId('');
    setShowAssignDialog(true);
  };

  const handleAssignVolunteer = async () => {
    if (!selectedRoleForAssignment || !selectedVolunteerId) return;

    try {
      setActionLoading(true);
      await assignVolunteerToRole(churchId, eventId, selectedRoleForAssignment, selectedVolunteerId);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
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
    if (!confirm(locale === 'pl' ? 'Czy na pewno chcesz usunąć tego wolontariusza?' : 'Are you sure you want to remove this volunteer?')) {
      return;
    }

    try {
      setActionLoading(true);
      await removeVolunteerFromRole(churchId, eventId, roleId, volunteerId);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
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
    try {
      setActionLoading(true);
      await updateVolunteerAssignmentStatus(churchId, eventId, roleId, volunteerId, status);
      const updatedEvent = await getEvent(churchId, eventId);
      setEvent(updatedEvent);
    } catch (err: any) {
      console.error('Error updating volunteer status:', err);
      setError(err.message || 'Failed to update volunteer status');
    } finally {
      setActionLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; class: string }> = {
      draft: {
        label: locale === 'pl' ? 'Szkic' : 'Draft',
        class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      },
      published: {
        label: locale === 'pl' ? 'Opublikowane' : 'Published',
        class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      },
      active: {
        label: locale === 'pl' ? 'Aktywne' : 'Active',
        class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      },
      completed: {
        label: locale === 'pl' ? 'Zakończone' : 'Completed',
        class: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      },
      canceled: {
        label: locale === 'pl' ? 'Anulowane' : 'Canceled',
        class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      },
    };
    return badges[status] || badges.draft;
  };

  const getTypeBadge = (type: string) => {
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
              {locale === 'pl' ? 'Ładowanie wydarzenia...' : 'Loading event...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">
            {locale === 'pl' ? 'Błąd ładowania wydarzenia' : 'Error loading event'}
          </p>
          <p className="text-sm mt-1">{error || (locale === 'pl' ? 'Nie znaleziono wydarzenia' : 'Event not found')}</p>
        </div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push(`/${locale}/churches/${churchId}/events`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do wydarzeń' : 'Back to Events'}
        </Button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(event.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/${locale}/churches/${churchId}/events`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {locale === 'pl' ? 'Powrót do wydarzeń' : 'Back to Events'}
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.class}`}>
                {statusBadge.label}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeBadge(event.type)}`}>
                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          </div>

          {isLeader && event.status !== 'canceled' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${locale}/churches/${churchId}/events/${eventId}/edit`)}
                disabled={actionLoading}
              >
                <Edit className="mr-2 h-4 w-4" />
                {locale === 'pl' ? 'Edytuj' : 'Edit'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
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

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'pl' ? 'Szczegóły wydarzenia' : 'Event Details'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {locale === 'pl' ? 'Opis' : 'Description'}
                  </h3>
                  <p className="text-base">{event.description}</p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {locale === 'pl' ? 'Data' : 'Date'}
                    </h3>
                    <p className="text-base">
                      {format(new Date(event.datetime.start), 'PPP', {
                        locale: locale === 'pl' ? pl : enUS,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {locale === 'pl' ? 'Godzina' : 'Time'}
                    </h3>
                    <p className="text-base">
                      {format(new Date(event.datetime.start), 'p', {
                        locale: locale === 'pl' ? pl : enUS,
                      })}
                      {' - '}
                      {format(new Date(event.datetime.end), 'p', {
                        locale: locale === 'pl' ? pl : enUS,
                      })}
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
                  <p className="text-base">{event.location.name}</p>
                  {event.location.address && (
                    <p className="text-sm text-muted-foreground">{event.location.address}</p>
                  )}
                  {event.location.room && (
                    <p className="text-sm text-muted-foreground">
                      {locale === 'pl' ? 'Sala' : 'Room'}: {event.location.room}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {event.roles && event.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {locale === 'pl' ? 'Role wolontariuszy' : 'Volunteer Roles'}
                </CardTitle>
                <CardDescription>
                  {locale === 'pl'
                    ? 'Role potrzebne do tego wydarzenia'
                    : 'Roles needed for this event'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {event.roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{role.name}</h4>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {role.assignments.length} / {role.requiredCount}
                        </span>
                      </div>
                      {role.skills && role.skills.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {role.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-secondary text-secondary-foreground"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isLeader && event.status !== 'canceled' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {locale === 'pl' ? 'Akcje wydarzenia' : 'Event Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelEvent}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {locale === 'pl' ? 'Anuluj wydarzenie' : 'Cancel Event'}
                </Button>
                {userRole === 'admin' && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteEvent}
                    disabled={actionLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {locale === 'pl' ? 'Usuń wydarzenie' : 'Delete Event'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {locale === 'pl' ? 'Agenda wydarzenia' : 'Event Agenda'}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'pl'
                      ? 'Zaplanuj szczegółowy przebieg wydarzenia'
                      : 'Plan the detailed flow of the event'}
                  </CardDescription>
                </div>
                {isLeader && (
                  <Button onClick={() => openAgendaDialog()} disabled={actionLoading}>
                    <Plus className="mr-2 h-4 w-4" />
                    {locale === 'pl' ? 'Dodaj element' : 'Add Item'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {event.agenda && event.agenda.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={event.agenda.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {event.agenda
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
                  <p>
                    {locale === 'pl'
                      ? 'Brak elementów w agendzie. Dodaj pierwszy element aby zaplanować wydarzenie.'
                      : 'No agenda items yet. Add your first item to plan the event.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volunteers" className="space-y-6">
          {event.roles && event.roles.length > 0 ? (
            event.roles.map((role) => {
              const assignedVolunteers = role.assignments || [];
              const availableSlots = role.requiredCount - assignedVolunteers.length;

              return (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {role.name}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {locale === 'pl' ? 'Przypisano' : 'Assigned'}: {assignedVolunteers.length} / {role.requiredCount}
                          </span>
                          {availableSlots > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              {availableSlots} {locale === 'pl' ? 'wolnych miejsc' : 'slots available'}
                            </span>
                          )}
                          {availableSlots === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              {locale === 'pl' ? 'Pełne' : 'Full'}
                            </span>
                          )}
                        </div>
                      </div>
                      {isLeader && availableSlots > 0 && (
                        <Button onClick={() => openAssignDialog(role.id)} disabled={actionLoading}>
                          <Plus className="mr-2 h-4 w-4" />
                          {locale === 'pl' ? 'Przypisz' : 'Assign'}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignedVolunteers.length > 0 ? (
                      <div className="space-y-3">
                        {assignedVolunteers.map((assignment) => {
                          const volunteer = churchMembers.find((m) => m.userId === assignment.userId);
                          if (!volunteer) return null;

                          return (
                            <div
                              key={assignment.userId}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {volunteer.firstName?.[0]}{volunteer.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {volunteer.firstName} {volunteer.lastName}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isLeader && (
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
                                    <SelectTrigger className="w-[140px]">
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
                                )}
                                {!isLeader && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${getVolunteerStatusColor(assignment.status)}`}
                                  >
                                    {getVolunteerStatusLabel(assignment.status)}
                                  </span>
                                )}
                                {isLeader && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveVolunteer(role.id, assignment.userId)}
                                    disabled={actionLoading}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {locale === 'pl'
                            ? 'Brak przypisanych wolontariuszy'
                            : 'No volunteers assigned yet'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {locale === 'pl' ? 'Role wolontariuszy' : 'Volunteer Roles'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {locale === 'pl'
                      ? 'Brak ról wolontariuszy dla tego wydarzenia. Dodaj role podczas tworzenia lub edycji wydarzenia.'
                      : 'No volunteer roles defined for this event. Add roles when creating or editing the event.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
                            <div className="font-medium">{template.title}</div>
                            {template.description && (
                              <div className="text-sm text-muted-foreground">
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
                              <div className="font-medium">{song.title}</div>
                              <div className="text-sm text-muted-foreground">{song.artist}</div>
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
                  {churchSongs.length > 0 &&
                    churchSongs.filter((song) => {
                      if (!songSearchTerm) return false;
                      const searchLower = songSearchTerm.toLowerCase();
                      return (
                        song.title.toLowerCase().includes(searchLower) ||
                        song.artist.toLowerCase().includes(searchLower)
                      );
                    }).length === 0 &&
                    songSearchTerm && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {locale === 'pl'
                            ? 'Nie znaleziono piosenek'
                            : 'No songs found'}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
            <DialogDescription>
              {editingAgendaItem
                ? locale === 'pl'
                  ? 'Edytuj ten element dla tego wydarzenia'
                  : 'Edit this item for this event'
                : locale === 'pl'
                ? 'Szablon będzie dostępny dla wszystkich wydarzeń'
                : 'Template will be available for all events'}
            </DialogDescription>
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
                placeholder={locale === 'pl' ? 'np. Powitanie, Kazanie, Modlitwa' : 'e.g. Welcome, Sermon, Prayer'}
                disabled={!!editingAgendaItem?.songId}
              />
              {editingAgendaItem?.songId && (
                <p className="text-xs text-muted-foreground">
                  {locale === 'pl' ? 'Tytuł nie może być edytowany dla piosenek' : 'Title cannot be edited for songs'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">
                {locale === 'pl' ? 'Czas trwania (mm:ss)' : 'Duration (mm:ss)'}
              </Label>
              <Input
                id="duration"
                type="text"
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
                  <Label htmlFor="editSongKey">
                    {locale === 'pl' ? 'Tonacja' : 'Key'} *
                  </Label>
                  <Select
                    value={agendaForm.songKey}
                    onValueChange={(value) =>
                      setAgendaForm((prev) => ({ ...prev, songKey: value }))
                    }
                  >
                    <SelectTrigger id="editSongKey">
                      <SelectValue placeholder={locale === 'pl' ? 'Wybierz tonację' : 'Select key'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="p-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {locale === 'pl' ? 'Tonacje durowe' : 'Major Keys'}
                        </div>
                        <div className="grid grid-cols-6 gap-1 mb-3">
                          {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((key) => (
                            <SelectItem key={key} value={key} className="justify-center">
                              {key}
                            </SelectItem>
                          ))}
                        </div>
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {locale === 'pl' ? 'Tonacje molowe' : 'Minor Keys'}
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'].map((key) => (
                            <SelectItem key={key} value={key} className="justify-center">
                              {key}
                            </SelectItem>
                          ))}
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSongLeader">
                    {locale === 'pl' ? 'Prowadzący' : 'Song Leader'}
                  </Label>
                  <Input
                    id="editSongLeader"
                    value={agendaForm.songLeader}
                    onChange={(e) =>
                      setAgendaForm((prev) => ({ ...prev, songLeader: e.target.value }))
                    }
                    placeholder={locale === 'pl' ? 'Imię i nazwisko' : 'Name'}
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
                placeholder={
                  locale === 'pl'
                    ? 'Dodatkowe informacje...'
                    : 'Additional information...'
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
              {actionLoading
                ? locale === 'pl'
                  ? 'Zapisywanie...'
                  : 'Saving...'
                : editingAgendaItem
                ? locale === 'pl'
                  ? 'Zapisz'
                  : 'Save'
                : locale === 'pl'
                ? 'Utwórz szablon'
                : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label htmlFor="songKey">
                {locale === 'pl' ? 'Tonacja' : 'Key'} *
              </Label>
              <Select
                value={songCustomForm.key}
                onValueChange={(value) =>
                  setSongCustomForm((prev) => ({ ...prev, key: value }))
                }
              >
                <SelectTrigger id="songKey">
                  <SelectValue placeholder={locale === 'pl' ? 'Wybierz tonację' : 'Select key'} />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {locale === 'pl' ? 'Tonacje durowe' : 'Major Keys'}
                    </div>
                    <div className="grid grid-cols-6 gap-1 mb-3">
                      {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((key) => (
                        <SelectItem key={key} value={key} className="justify-center">
                          {key}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {locale === 'pl' ? 'Tonacje molowe' : 'Minor Keys'}
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {['Cm', 'C#m', 'Dm', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'Abm', 'Am', 'Bbm', 'Bm'].map((key) => (
                        <SelectItem key={key} value={key} className="justify-center">
                          {key}
                        </SelectItem>
                      ))}
                    </div>
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="songLeader">
                {locale === 'pl' ? 'Prowadzący' : 'Song Leader'}
              </Label>
              <Input
                id="songLeader"
                value={songCustomForm.leader}
                onChange={(e) =>
                  setSongCustomForm((prev) => ({ ...prev, leader: e.target.value }))
                }
                placeholder={locale === 'pl' ? 'Imię i nazwisko' : 'Name'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="songDuration">
                {locale === 'pl' ? 'Czas trwania (mm:ss)' : 'Duration (mm:ss)'}
              </Label>
              <Input
                id="songDuration"
                type="text"
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
              {actionLoading
                ? locale === 'pl'
                  ? 'Dodawanie...'
                  : 'Adding...'
                : locale === 'pl'
                ? 'Dodaj do agendy'
                : 'Add to Agenda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'pl' ? 'Przypisz wolontariusza' : 'Assign Volunteer'}
            </DialogTitle>
            <DialogDescription>
              {locale === 'pl'
                ? 'Wybierz członka kościoła do przypisania do tej roli'
                : 'Select a church member to assign to this role'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="volunteer">
                {locale === 'pl' ? 'Wolontariusz' : 'Volunteer'} *
              </Label>
              <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                <SelectTrigger id="volunteer">
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
                      // Filter out members already assigned to this role
                      const role = event?.roles?.find(
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
              {actionLoading
                ? locale === 'pl'
                  ? 'Przypisywanie...'
                  : 'Assigning...'
                : locale === 'pl'
                ? 'Przypisz'
                : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {actionLoading
                ? locale === 'pl'
                  ? 'Usuwanie...'
                  : 'Deleting...'
                : locale === 'pl'
                ? 'Usuń'
                : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
