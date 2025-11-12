import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { getChurchMembership } from './church';

export interface AgendaItemTemplate {
  id: string;
  churchId: string;
  title: string;
  description?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Remove undefined values from an object recursively
 */
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

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
 * Create a new agenda item template
 */
export async function createAgendaTemplate(
  churchId: string,
  templateData: Omit<AgendaItemTemplate, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>
): Promise<AgendaItemTemplate> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to create an agenda template');
  }

  try {
    const membership = await getChurchMembership(churchId);
    console.log('Creating template - membership:', membership);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      console.error('Permission denied - membership:', membership);
      throw new Error('You do not have permission to create agenda templates');
    }

    const templateRef = doc(collection(db, 'churches', churchId, 'agendaTemplates'));
    const template: Omit<AgendaItemTemplate, 'id'> = {
      ...templateData,
      churchId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    const cleanedTemplate = removeUndefined(template);
    console.log('Attempting to create template:', cleanedTemplate);

    await setDoc(templateRef, cleanedTemplate);
    console.log('Template created successfully');

    return {
      id: templateRef.id,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Error creating agenda template:', error);
    console.error('Error code:', error.code);
    console.error('Error details:', error);
    throw new Error(error.message || 'Failed to create agenda template');
  }
}

/**
 * Get all agenda templates for a church
 */
export async function getAgendaTemplates(churchId: string): Promise<AgendaItemTemplate[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view agenda templates');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You do not have access to this church');
    }

    const templatesRef = collection(db, 'churches', churchId, 'agendaTemplates');
    const q = query(templatesRef, orderBy('title', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      };
    }) as AgendaItemTemplate[];
  } catch (error: any) {
    console.error('Error fetching agenda templates:', error);
    throw new Error(error.message || 'Failed to fetch agenda templates');
  }
}

/**
 * Update an agenda template
 */
export async function updateAgendaTemplate(
  churchId: string,
  templateId: string,
  updates: Partial<Omit<AgendaItemTemplate, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to update an agenda template');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to update agenda templates');
    }

    const templateRef = doc(db, 'churches', churchId, 'agendaTemplates', templateId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    const cleanedUpdate = removeUndefined(updateData);
    await updateDoc(templateRef, cleanedUpdate);
  } catch (error: any) {
    console.error('Error updating agenda template:', error);
    throw new Error(error.message || 'Failed to update agenda template');
  }
}

/**
 * Delete an agenda template
 */
export async function deleteAgendaTemplate(churchId: string, templateId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to delete an agenda template');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership || (membership.role !== 'admin' && membership.role !== 'leader')) {
      throw new Error('You do not have permission to delete agenda templates');
    }

    const templateRef = doc(db, 'churches', churchId, 'agendaTemplates', templateId);
    await deleteDoc(templateRef);
  } catch (error: any) {
    console.error('Error deleting agenda template:', error);
    throw new Error(error.message || 'Failed to delete agenda template');
  }
}
