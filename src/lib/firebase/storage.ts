import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTaskSnapshot,
  StorageReference,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Firebase Storage utilities for file management
 */

/**
 * Upload a file to storage
 */
export const uploadFile = async (
  path: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, path);

  if (onProgress) {
    // Use resumable upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } else {
    // Simple upload without progress tracking
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
};

/**
 * Upload a church logo
 */
export const uploadChurchLogo = async (
  churchId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const path = `churches/${churchId}/logo/${file.name}`;
  return uploadFile(path, file, onProgress);
};

/**
 * Upload a user avatar
 */
export const uploadUserAvatar = async (
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const path = `users/${userId}/avatar/${file.name}`;
  return uploadFile(path, file, onProgress);
};

/**
 * Upload an event attachment
 */
export const uploadEventAttachment = async (
  churchId: string,
  eventId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const path = `churches/${churchId}/events/${eventId}/attachments/${file.name}`;
  return uploadFile(path, file, onProgress);
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
};

/**
 * Delete a file by URL
 */
export const deleteFileByUrl = async (url: string): Promise<void> => {
  const storageRef = ref(storage, url);
  return deleteObject(storageRef);
};

/**
 * List all files in a directory
 */
export const listFiles = async (path: string): Promise<StorageReference[]> => {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  return result.items;
};

/**
 * Get download URL for a file
 */
export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};

/**
 * Validate file size and type
 */
export const validateFile = (
  file: File,
  maxSizeMB = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']
): { valid: boolean; error?: string } => {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
};
