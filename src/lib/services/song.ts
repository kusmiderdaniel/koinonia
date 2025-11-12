import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { getChurchMembership } from './church';
import type { Song } from '@/types/song';

/**
 * Remove undefined values from an object recursively
 * Firestore doesn't accept undefined values
 */
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Preserve Date objects, Timestamps, and other special objects
  if (obj instanceof Date || obj.toDate || obj.seconds) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefined(obj[key]);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Create a new song
 */
export async function createSong(
  churchId: string,
  songData: Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'churchId' | 'usageCount' | 'lastUsed'>
): Promise<Song> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to create a song');
  }

  try {
    // Check if user has permission
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to create songs');
    }

    // Create song document
    const songRef = doc(collection(db, 'churches', churchId, 'songs'));
    const song: Omit<Song, 'id'> = {
      ...songData,
      churchId,
      usageCount: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    // Remove undefined values before saving to Firestore
    const cleanedSong = removeUndefined(song);

    await setDoc(songRef, cleanedSong);

    return {
      id: songRef.id,
      ...song,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Error creating song:', error);
    throw new Error(error.message || 'Failed to create song');
  }
}

/**
 * Get all songs for a church
 */
export async function getChurchSongs(churchId: string): Promise<Song[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view songs');
  }

  try {
    // Verify user has access to this church
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const songsRef = collection(db, 'churches', churchId, 'songs');
    const q = query(songsRef, orderBy('title', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastUsed: data.lastUsed?.toDate ? data.lastUsed.toDate() : data.lastUsed ? new Date(data.lastUsed) : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };
    }) as Song[];
  } catch (error: any) {
    console.error('Error fetching songs:', error);
    throw new Error(error.message || 'Failed to fetch songs');
  }
}

/**
 * Get a specific song by ID
 */
export async function getSong(churchId: string, songId: string): Promise<Song> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view this song');
  }

  try {
    // Verify user has access to this church
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const songRef = doc(db, 'churches', churchId, 'songs', songId);
    const songDoc = await getDoc(songRef);

    if (!songDoc.exists()) {
      throw new Error('Song not found');
    }

    const data = songDoc.data();
    return {
      id: songDoc.id,
      ...data,
      lastUsed: data.lastUsed?.toDate ? data.lastUsed.toDate() : data.lastUsed ? new Date(data.lastUsed) : undefined,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Song;
  } catch (error: any) {
    console.error('Error fetching song:', error);
    throw new Error(error.message || 'Failed to fetch song');
  }
}

/**
 * Update a song
 */
export async function updateSong(
  churchId: string,
  songId: string,
  updates: Partial<Omit<Song, 'id' | 'churchId' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to update a song');
  }

  try {
    // Check if user has permission
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to update songs');
    }

    const songRef = doc(db, 'churches', churchId, 'songs', songId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined values before saving to Firestore
    const cleanedUpdate = removeUndefined(updateData);

    await updateDoc(songRef, cleanedUpdate);
  } catch (error: any) {
    console.error('Error updating song:', error);
    throw new Error(error.message || 'Failed to update song');
  }
}

/**
 * Delete a song
 */
export async function deleteSong(churchId: string, songId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to delete a song');
  }

  try {
    // Check if user is an admin
    const membership = await getChurchMembership(churchId);
    if (!membership || membership.role !== 'admin') {
      throw new Error('Only admins can delete songs');
    }

    const songRef = doc(db, 'churches', churchId, 'songs', songId);
    await deleteDoc(songRef);
  } catch (error: any) {
    console.error('Error deleting song:', error);
    throw new Error(error.message || 'Failed to delete song');
  }
}

/**
 * Increment usage count and update last used date
 */
export async function recordSongUsage(churchId: string, songId: string): Promise<void> {
  try {
    const songRef = doc(db, 'churches', churchId, 'songs', songId);
    await updateDoc(songRef, {
      usageCount: increment(1),
      lastUsed: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error recording song usage:', error);
    // Don't throw error - this is a non-critical operation
  }
}

/**
 * Search songs by title, artist, or themes
 */
export async function searchSongs(churchId: string, searchTerm: string): Promise<Song[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to search songs');
  }

  try {
    // Verify user has access to this church
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const allSongs = await getChurchSongs(churchId);

    // Filter songs by search term (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    return allSongs.filter((song) =>
      song.title.toLowerCase().includes(searchLower) ||
      song.artist.toLowerCase().includes(searchLower) ||
      song.themes.some((theme) => theme.toLowerCase().includes(searchLower))
    );
  } catch (error: any) {
    console.error('Error searching songs:', error);
    throw new Error(error.message || 'Failed to search songs');
  }
}
