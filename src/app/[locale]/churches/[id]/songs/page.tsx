'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks';
import {
  getChurchSongs,
  createSong,
  updateSong,
  deleteSong,
} from '@/lib/services/song';
import { getChurchMembership } from '@/lib/services/church';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Search,
  Edit,
  Trash2,
  Music,
  Clock,
} from 'lucide-react';
import type { Song } from '@/types/song';

export default function SongsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const churchId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showSongDialog, setShowSongDialog] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [songForm, setSongForm] = useState({
    title: '',
    artist: '',
    album: '',
    key: '',
    tempo: 'medium' as 'slow' | 'medium' | 'fast',
    duration: '',
    themes: '',
    notes: '',
    ccliNumber: '',
  });

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

        const [songsData, membership] = await Promise.all([
          getChurchSongs(churchId),
          getChurchMembership(churchId),
        ]);

        if (!isMounted) return;

        setSongs(songsData);
        setFilteredSongs(songsData);
        setUserRole(membership?.role || null);
      } catch (err: any) {
        console.error('Error loading songs:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load songs');
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

  useEffect(() => {
    if (!searchTerm) {
      setFilteredSongs(songs);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = songs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchLower) ||
          song.artist.toLowerCase().includes(searchLower) ||
          song.themes.some((theme) => theme.toLowerCase().includes(searchLower))
      );
      setFilteredSongs(filtered);
    }
  }, [searchTerm, songs]);

  const isLeader = userRole === 'admin' || userRole === 'leader';

  const openSongDialog = (song?: Song) => {
    if (song) {
      setEditingSong(song);
      setSongForm({
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        key: song.key,
        tempo: song.tempo,
        duration: secondsToMMSS(song.duration),
        themes: song.themes.join(', '),
        notes: song.notes || '',
        ccliNumber: song.ccliNumber || '',
      });
    } else {
      setEditingSong(null);
      setSongForm({
        title: '',
        artist: '',
        album: '',
        key: '',
        tempo: 'medium',
        duration: '',
        themes: '',
        notes: '',
        ccliNumber: '',
      });
    }
    setShowSongDialog(true);
  };

  const handleSaveSong = async () => {
    if (!songForm.title || !songForm.artist) {
      setError(locale === 'pl' ? 'Title and artist are required' : 'Title and artist are required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const themes = songForm.themes
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);

      const songData = {
        title: songForm.title,
        artist: songForm.artist,
        album: songForm.album || undefined,
        key: songForm.key,
        tempo: songForm.tempo,
        duration: mmssToSeconds(songForm.duration),
        themes,
        notes: songForm.notes || undefined,
        ccliNumber: songForm.ccliNumber || undefined,
      };

      if (editingSong) {
        await updateSong(churchId, editingSong.id, songData);
      } else {
        await createSong(churchId, songData);
      }

      const updatedSongs = await getChurchSongs(churchId);
      setSongs(updatedSongs);
      setFilteredSongs(updatedSongs);
      setShowSongDialog(false);
      setSongForm({
        title: '',
        artist: '',
        album: '',
        key: '',
        tempo: 'medium',
        duration: '',
        themes: '',
        notes: '',
        ccliNumber: '',
      });
      setEditingSong(null);
    } catch (err: any) {
      console.error('Error saving song:', err);
      setError(err.message || 'Failed to save song');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!confirm(locale === 'pl' ? 'Are you sure?' : 'Are you sure?')) {
      return;
    }

    try {
      setActionLoading(true);
      await deleteSong(churchId, songId);
      const updatedSongs = await getChurchSongs(churchId);
      setSongs(updatedSongs);
      setFilteredSongs(updatedSongs);
    } catch (err: any) {
      console.error('Error deleting song:', err);
      setError(err.message || 'Failed to delete song');
    } finally {
      setActionLoading(false);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {locale === 'pl' ? 'Loading songs...' : 'Loading songs...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'pl' ? 'Songs Library' : 'Songs Library'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'pl' ? 'Manage songs for your church' : 'Manage songs for your church'}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive mb-6">
          <p className="font-medium">{locale === 'pl' ? 'Error' : 'Error'}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, artist, or theme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {isLeader && (
              <Button onClick={() => openSongDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                {locale === 'pl' ? 'Add Song' : 'Add Song'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredSongs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song) => (
            <Card key={song.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{song.title}</CardTitle>
                    <CardDescription>{song.artist}</CardDescription>
                  </div>
                  {isLeader && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSongDialog(song)}
                        disabled={actionLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSong(song.id)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <span>Key: {song.key}</span>
                    <span className="text-muted-foreground">|</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{getTempoLabel(song.tempo)}</span>
                  </div>
                  {song.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {song.themes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-secondary text-secondary-foreground"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                  {song.usageCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Used: {song.usageCount} times
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchTerm
                  ? 'No songs found matching your search'
                  : 'No songs in library yet. Add your first song.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showSongDialog} onOpenChange={setShowSongDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSong ? 'Edit Song' : 'Add Song'}
            </DialogTitle>
            <DialogDescription>Enter song details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={songForm.title}
                  onChange={(e) =>
                    setSongForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Amazing Grace"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="artist">Artist *</Label>
                <Input
                  id="artist"
                  value={songForm.artist}
                  onChange={(e) =>
                    setSongForm((prev) => ({ ...prev, artist: e.target.value }))
                  }
                  placeholder="e.g. Hillsong"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Select
                  value={songForm.key}
                  onValueChange={(value) =>
                    setSongForm((prev) => ({ ...prev, key: value }))
                  }
                >
                  <SelectTrigger id="key">
                    <SelectValue placeholder="Select key" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    <div className="p-2">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Major Keys
                      </div>
                      <div className="grid grid-cols-6 gap-1 mb-3">
                        {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map((key) => (
                          <SelectItem key={key} value={key} className="justify-center">
                            {key}
                          </SelectItem>
                        ))}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Minor Keys
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
                <Label htmlFor="tempo">Tempo</Label>
                <Select
                  value={songForm.tempo}
                  onValueChange={(value) =>
                    setSongForm((prev) => ({ ...prev, tempo: value as any }))
                  }
                >
                  <SelectTrigger id="tempo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">{getTempoLabel('slow')}</SelectItem>
                    <SelectItem value="medium">{getTempoLabel('medium')}</SelectItem>
                    <SelectItem value="fast">{getTempoLabel('fast')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (mm:ss)</Label>
                <Input
                  id="duration"
                  type="text"
                  value={songForm.duration}
                  onChange={(e) =>
                    setSongForm((prev) => ({ ...prev, duration: e.target.value }))
                  }
                  placeholder="3:45"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ccliNumber">CCLI #</Label>
                <Input
                  id="ccliNumber"
                  value={songForm.ccliNumber}
                  onChange={(e) =>
                    setSongForm((prev) => ({ ...prev, ccliNumber: e.target.value }))
                  }
                  placeholder="1234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="themes">Themes (comma-separated)</Label>
              <Input
                id="themes"
                value={songForm.themes}
                onChange={(e) =>
                  setSongForm((prev) => ({ ...prev, themes: e.target.value }))
                }
                placeholder="Worship, Easter, Christmas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={songForm.notes}
                onChange={(e) =>
                  setSongForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSongDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveSong} disabled={actionLoading}>
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
