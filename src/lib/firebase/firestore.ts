import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  setDoc,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Generic Firestore utilities for CRUD operations
 */

// Create a new document
export const createDocument = async <T extends Record<string, any>>(
  collectionPath: string,
  data: T
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionPath), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

// Create a document with custom ID
export const setDocument = async <T extends Record<string, any>>(
  collectionPath: string,
  docId: string,
  data: T
): Promise<void> => {
  await setDoc(doc(db, collectionPath, docId), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

// Get a single document by ID
export const getDocument = async <T>(
  collectionPath: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

// Get multiple documents with optional query constraints
export const getDocuments = async <T>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const q = query(collection(db, collectionPath), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// Update a document
export const updateDocument = async <T extends Record<string, any>>(
  collectionPath: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

// Delete a document
export const deleteDocument = async (
  collectionPath: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
};

// Batch write operations
export const batchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collectionPath: string;
    docId: string;
    data?: any;
  }>
): Promise<void> => {
  const batch = writeBatch(db);

  operations.forEach(({ type, collectionPath, docId, data }) => {
    const docRef = doc(db, collectionPath, docId);

    switch (type) {
      case 'set':
        batch.set(docRef, { ...data, updatedAt: Timestamp.now() });
        break;
      case 'update':
        batch.update(docRef, { ...data, updatedAt: Timestamp.now() });
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
  });

  await batch.commit();
};

// Real-time listener for a collection
export const subscribeToCollection = <T>(
  collectionPath: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
) => {
  const q = query(collection(db, collectionPath), ...constraints);

  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
};

// Real-time listener for a single document
export const subscribeToDocument = <T>(
  collectionPath: string,
  docId: string,
  callback: (data: T | null) => void
) => {
  const docRef = doc(db, collectionPath, docId);

  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as T);
    } else {
      callback(null);
    }
  });
};

// Paginated query
export const getPaginatedDocuments = async <T>(
  collectionPath: string,
  pageSize: number,
  lastDoc?: DocumentSnapshot,
  constraints: QueryConstraint[] = []
): Promise<{ data: T[]; lastDoc: DocumentSnapshot | null }> => {
  let q = query(
    collection(db, collectionPath),
    ...constraints,
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];

  return {
    data,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
  };
};

// Helper to build church-scoped collection path
export const getChurchCollectionPath = (
  churchId: string,
  subCollection: string
): string => {
  return `churches/${churchId}/${subCollection}`;
};

// Query helpers
export { where, orderBy, limit, startAfter };
