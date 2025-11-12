import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
  UserCredential,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Authentication utilities using Firebase Auth
 */

// Google OAuth provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Update profile with display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }

  // Create user document in Firestore
  if (userCredential.user) {
    const nameParts = displayName?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userDoc = {
      email: userCredential.user.email,
      profile: {
        firstName,
        lastName,
        phone: '',
        avatar: '',
        bio: '',
      },
      churchMemberships: {},
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        timezone: 'Europe/Warsaw',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

    // Send email verification
    await sendEmailVerification(userCredential.user);
  }

  return userCredential;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  const userCredential = await signInWithPopup(auth, googleProvider);

  // Create user document in Firestore if it doesn't exist
  if (userCredential.user) {
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      const displayName = userCredential.user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const userDoc = {
        email: userCredential.user.email,
        profile: {
          firstName,
          lastName,
          phone: '',
          avatar: userCredential.user.photoURL || '',
          bio: '',
        },
        churchMemberships: {},
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          timezone: 'Europe/Warsaw',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userDoc);
    }
  }

  return userCredential;
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Send email verification to current user
 */
export const sendVerificationEmail = async (): Promise<void> => {
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser);
  }
  throw new Error('No user is currently signed in');
};

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  if (auth.currentUser) {
    return updateProfile(auth.currentUser, updates);
  }
  throw new Error('No user is currently signed in');
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Get ID token for authenticated requests
 */
export const getIdToken = async (forceRefresh = false): Promise<string> => {
  if (auth.currentUser) {
    return auth.currentUser.getIdToken(forceRefresh);
  }
  throw new Error('No user is currently signed in');
};

/**
 * Get custom claims from ID token
 */
export const getCustomClaims = async (): Promise<any> => {
  if (auth.currentUser) {
    const idTokenResult = await auth.currentUser.getIdTokenResult();
    return idTokenResult.claims;
  }
  throw new Error('No user is currently signed in');
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Check if user has role for a specific church
 */
export const hasChurchRole = async (
  churchId: string,
  requiredRole?: 'admin' | 'leader' | 'volunteer'
): Promise<boolean> => {
  try {
    const claims = await getCustomClaims();
    const churchRoles = claims?.churches;

    if (!churchRoles || !churchRoles[churchId]) {
      return false;
    }

    if (!requiredRole) {
      return true; // User is a member of the church
    }

    const userRole = churchRoles[churchId].role;

    // Admin has all permissions
    if (userRole === 'admin') return true;

    // Leader has leader and volunteer permissions
    if (userRole === 'leader' && requiredRole !== 'admin') return true;

    // Volunteer only has volunteer permissions
    if (userRole === 'volunteer' && requiredRole === 'volunteer') return true;

    return false;
  } catch (error) {
    console.error('Error checking church role:', error);
    return false;
  }
};
