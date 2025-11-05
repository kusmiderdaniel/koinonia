/**
 * Song and worship-related types
 */

export type SongTempo = 'slow' | 'medium' | 'fast';

export interface Song {
  id: string;
  churchId: string;
  title: string;
  artist: string;
  album?: string;
  key: string; // e.g., "G", "Am", "D#"
  tempo: SongTempo;
  themes: string[]; // e.g., ["Worship", "Easter", "Christmas"]
  lyrics: string;
  chords?: string;
  notes?: string;
  ccliNumber?: string; // CCLI licensing number
  lastUsed?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setlist {
  id: string;
  churchId: string;
  eventId?: string; // Associated event if applicable
  name: string;
  date?: Date;
  songs: SetlistSong[];
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SetlistSong {
  songId: string;
  order: number;
  key?: string; // Override song's default key
  tempo?: SongTempo; // Override song's default tempo
  notes?: string; // Notes specific to this performance
}
