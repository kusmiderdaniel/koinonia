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
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { getChurchMembership } from './church';
import type { Event, EventWithVolunteers, EventAgendaItem } from '@/types/event';

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
 * Create a new event
 */
export async function createEvent(
  churchId: string,
  eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'churchId'>
): Promise<Event> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to create an event');
  }

  try {
    // Check if user has permission to create events
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to create events');
    }

    // Create event document
    const eventRef = doc(collection(db, 'churches', churchId, 'events'));
    const event: Omit<Event, 'id'> = {
      ...eventData,
      churchId,
      createdBy: user.uid,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    // Remove undefined values before saving to Firestore
    const cleanedEvent = removeUndefined(event);

    await setDoc(eventRef, cleanedEvent);

    return {
      id: eventRef.id,
      ...event,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Error creating event:', error);
    throw new Error(error.message || 'Failed to create event');
  }
}

/**
 * Get all events for a church
 */
export async function getChurchEvents(churchId: string): Promise<Event[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view events');
  }

  try {
    // Verify user has access to this church
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const eventsRef = collection(db, 'churches', churchId, 'events');
    const q = query(eventsRef, orderBy('datetime.start', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        datetime: {
          start: data.datetime.start?.toDate ? data.datetime.start.toDate() : new Date(data.datetime.start),
          end: data.datetime.end?.toDate ? data.datetime.end.toDate() : new Date(data.datetime.end),
          timezone: data.datetime.timezone,
        },
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };
    }) as Event[];
  } catch (error: any) {
    console.error('Error fetching events:', error);
    throw new Error(error.message || 'Failed to fetch events');
  }
}

/**
 * Get upcoming events for a church
 */
export async function getUpcomingEvents(churchId: string, limit?: number): Promise<Event[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view events');
  }

  try {
    // Verify user has access to this church
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const eventsRef = collection(db, 'churches', churchId, 'events');
    const now = Timestamp.now();

    let q = query(
      eventsRef,
      where('datetime.start', '>=', now),
      where('status', '==', 'published'),
      orderBy('datetime.start', 'asc')
    );

    const snapshot = await getDocs(q);
    let events = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        datetime: {
          start: data.datetime.start?.toDate ? data.datetime.start.toDate() : new Date(data.datetime.start),
          end: data.datetime.end?.toDate ? data.datetime.end.toDate() : new Date(data.datetime.end),
          timezone: data.datetime.timezone,
        },
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Event;
    });

    if (limit) {
      events = events.slice(0, limit);
    }

    return events;
  } catch (error: any) {
    console.error('Error fetching upcoming events:', error);
    throw new Error(error.message || 'Failed to fetch upcoming events');
  }
}

/**
 * Get a specific event by ID
 */
export async function getEvent(churchId: string, eventId: string): Promise<Event> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view this event');
  }

  try {
    // Verify user has access to this church
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }

    const data = eventDoc.data();
    return {
      id: eventDoc.id,
      ...data,
      datetime: {
        start: data.datetime.start?.toDate ? data.datetime.start.toDate() : new Date(data.datetime.start),
        end: data.datetime.end?.toDate ? data.datetime.end.toDate() : new Date(data.datetime.end),
        timezone: data.datetime.timezone,
      },
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Event;
  } catch (error: any) {
    console.error('Error fetching event:', error);
    throw new Error(error.message || 'Failed to fetch event');
  }
}

/**
 * Update an event
 */
export async function updateEvent(
  churchId: string,
  eventId: string,
  updates: Partial<Omit<Event, 'id' | 'churchId' | 'createdBy' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to update an event');
  }

  try {
    // Check if user has permission
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to update events');
    }

    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Remove undefined values before saving to Firestore
    const cleanedUpdate = removeUndefined(updateData);

    await updateDoc(eventRef, cleanedUpdate);
  } catch (error: any) {
    console.error('Error updating event:', error);
    throw new Error(error.message || 'Failed to update event');
  }
}

/**
 * Delete an event
 */
export async function deleteEvent(churchId: string, eventId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to delete an event');
  }

  try {
    // Check if user is an admin
    const membership = await getChurchMembership(churchId);
    if (!membership || membership.role !== 'admin') {
      throw new Error('Only admins can delete events');
    }

    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (error: any) {
    console.error('Error deleting event:', error);
    throw new Error(error.message || 'Failed to delete event');
  }
}

/**
 * Cancel an event (soft delete)
 */
export async function cancelEvent(churchId: string, eventId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to cancel an event');
  }

  try {
    // Check if user has permission
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to cancel events');
    }

    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      status: 'canceled',
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error canceling event:', error);
    throw new Error(error.message || 'Failed to cancel event');
  }
}

/**
 * Add an agenda item to an event
 */
export async function addAgendaItem(
  churchId: string,
  eventId: string,
  item: Omit<EventAgendaItem, 'id' | 'order'>
): Promise<EventAgendaItem> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to edit events');
    }

    // Get current event
    const event = await getEvent(churchId, eventId);
    const currentAgenda = event.agenda || [];

    // Create new agenda item with next order number
    const newItem: EventAgendaItem = {
      ...item,
      id: Date.now().toString(),
      order: currentAgenda.length,
    };

    // Add to agenda array
    const updatedAgenda = [...currentAgenda, newItem];

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      agenda: removeUndefined(updatedAgenda),
      updatedAt: serverTimestamp(),
    });

    return newItem;
  } catch (error: any) {
    console.error('Error adding agenda item:', error);
    throw new Error(error.message || 'Failed to add agenda item');
  }
}

/**
 * Update an agenda item
 */
export async function updateAgendaItem(
  churchId: string,
  eventId: string,
  itemId: string,
  updates: Partial<Omit<EventAgendaItem, 'id' | 'order'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to edit events');
    }

    // Get current event
    const event = await getEvent(churchId, eventId);
    const currentAgenda = event.agenda || [];

    // Update the specific item
    const updatedAgenda = currentAgenda.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      agenda: removeUndefined(updatedAgenda),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating agenda item:', error);
    throw new Error(error.message || 'Failed to update agenda item');
  }
}

/**
 * Delete an agenda item
 */
export async function deleteAgendaItem(
  churchId: string,
  eventId: string,
  itemId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to edit events');
    }

    // Get current event
    const event = await getEvent(churchId, eventId);
    const currentAgenda = event.agenda || [];

    // Remove the item and reorder
    const updatedAgenda = currentAgenda
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      agenda: removeUndefined(updatedAgenda),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error deleting agenda item:', error);
    throw new Error(error.message || 'Failed to delete agenda item');
  }
}

/**
 * Reorder agenda items
 */
export async function reorderAgendaItems(
  churchId: string,
  eventId: string,
  items: EventAgendaItem[]
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to edit events');
    }

    // Reorder items
    const reorderedAgenda = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      agenda: removeUndefined(reorderedAgenda),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error reordering agenda items:', error);
    throw new Error(error.message || 'Failed to reorder agenda items');
  }
}

/**
 * Assign a volunteer to an event role
 */
export async function assignVolunteerToRole(
  churchId: string,
  eventId: string,
  roleId: string,
  volunteerId: string,
  notes?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to assign volunteers');
    }

    // Get current event
    const event = await getEvent(churchId, eventId);
    const roles = event.roles || [];

    // Find the role
    const roleIndex = roles.findIndex((r) => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    // Check if volunteer is already assigned
    const existingAssignment = roles[roleIndex].assignments.find(
      (a) => a.userId === volunteerId
    );
    if (existingAssignment) {
      throw new Error('Volunteer is already assigned to this role');
    }

    // Check if role is full
    if (roles[roleIndex].assignments.length >= roles[roleIndex].requiredCount) {
      throw new Error('This role is already full');
    }

    // Create new assignment
    const newAssignment = {
      userId: volunteerId,
      status: 'invited' as const,
      assignedAt: new Date(),
      notes,
    };

    // Update the role with the new assignment
    roles[roleIndex].assignments.push(newAssignment);

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      roles: removeUndefined(roles),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error assigning volunteer:', error);
    throw new Error(error.message || 'Failed to assign volunteer');
  }
}

/**
 * Remove a volunteer from an event role
 */
export async function removeVolunteerFromRole(
  churchId: string,
  eventId: string,
  roleId: string,
  volunteerId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to remove volunteers');
    }

    // Get current event
    const event = await getEvent(churchId, eventId);
    const roles = event.roles || [];

    // Find the role
    const roleIndex = roles.findIndex((r) => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    // Remove the volunteer from assignments
    roles[roleIndex].assignments = roles[roleIndex].assignments.filter(
      (a) => a.userId !== volunteerId
    );

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      roles: removeUndefined(roles),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error removing volunteer:', error);
    throw new Error(error.message || 'Failed to remove volunteer');
  }
}

/**
 * Update a volunteer assignment status
 */
export async function updateVolunteerAssignmentStatus(
  churchId: string,
  eventId: string,
  roleId: string,
  volunteerId: string,
  status: 'invited' | 'accepted' | 'declined' | 'confirmed' | 'no_show',
  notes?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to update volunteer assignments');
    }

    // Get current event
    const event = await getEvent(churchId, eventId);
    const roles = event.roles || [];

    // Find the role
    const roleIndex = roles.findIndex((r) => r.id === roleId);
    if (roleIndex === -1) {
      throw new Error('Role not found');
    }

    // Find the assignment
    const assignmentIndex = roles[roleIndex].assignments.findIndex(
      (a) => a.userId === volunteerId
    );
    if (assignmentIndex === -1) {
      throw new Error('Assignment not found');
    }

    // Update the assignment
    roles[roleIndex].assignments[assignmentIndex] = {
      ...roles[roleIndex].assignments[assignmentIndex],
      status,
      responseAt: new Date(),
      notes: notes || roles[roleIndex].assignments[assignmentIndex].notes,
    };

    // Update event
    const eventRef = doc(db, 'churches', churchId, 'events', eventId);
    await updateDoc(eventRef, {
      roles: removeUndefined(roles),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating volunteer assignment:', error);
    throw new Error(error.message || 'Failed to update volunteer assignment');
  }
}

/**
 * Get all unique agenda items from previous events in the church
 */
export async function getPreviousAgendaItems(churchId: string): Promise<EventAgendaItem[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    // Get all events for this church
    const eventsRef = collection(db, 'churches', churchId, 'events');
    const q = query(eventsRef, orderBy('datetime.start', 'desc'));
    const snapshot = await getDocs(q);

    // Collect all agenda items from all events
    const allAgendaItems: EventAgendaItem[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.agenda && Array.isArray(data.agenda)) {
        allAgendaItems.push(...data.agenda);
      }
    });

    // Create a map to deduplicate by title (case-insensitive)
    const uniqueItemsMap = new Map<string, EventAgendaItem>();
    allAgendaItems.forEach((item) => {
      const key = item.title.toLowerCase().trim();
      if (!uniqueItemsMap.has(key)) {
        uniqueItemsMap.set(key, item);
      }
    });

    // Convert map to array and sort by title
    return Array.from(uniqueItemsMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  } catch (error: any) {
    console.error('Error fetching previous agenda items:', error);
    throw new Error(error.message || 'Failed to fetch previous agenda items');
  }
}
