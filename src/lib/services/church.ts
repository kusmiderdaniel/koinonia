import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import type { Church, ChurchMembership } from '@/types/church';
import type { CreateChurchFormData, UpdateChurchFormData } from '@/lib/validations/church';

/**
 * Generate a unique 8-character invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if an invite code is unique
 */
async function isInviteCodeUnique(code: string): Promise<boolean> {
  const churchesRef = collection(db, 'churches');
  const q = query(churchesRef, where('inviteCode', '==', code));
  const snapshot = await getDocs(q);
  return snapshot.empty;
}

/**
 * Generate a unique invite code
 */
async function generateUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  let attempts = 0;
  const maxAttempts = 10;

  while (!(await isInviteCodeUnique(code)) && attempts < maxAttempts) {
    code = generateInviteCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique invite code');
  }

  return code;
}

/**
 * Create a new church
 */
export async function createChurch(data: CreateChurchFormData): Promise<Church> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to create a church');
  }

  try {
    // Generate unique invite code
    const inviteCode = await generateUniqueInviteCode();

    // Create church document
    const churchRef = doc(collection(db, 'churches'));
    const churchData: Omit<Church, 'id'> = {
      name: data.name,
      denomination: data.denomination || null,
      address: data.address,
      contactInfo: {
        email: data.contactInfo.email,
        phone: data.contactInfo.phone,
        website: data.contactInfo.website || null,
      },
      description: data.description || null,
      inviteCode,
      settings: {
        features: {
          events: true,
          volunteers: true,
          songs: true,
          announcements: true,
        },
        permissions: {
          whoCanCreateEvents: ['admin', 'leader'],
          whoCanManageVolunteers: ['admin', 'leader'],
          whoCanManageSongs: ['admin', 'leader'],
        },
      },
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };

    await setDoc(churchRef, churchData);

    // Create membership for the creator (admin role)
    const membershipRef = doc(collection(db, 'churchMemberships'));
    const membershipData: Omit<ChurchMembership, 'id'> = {
      userId: user.uid,
      churchId: churchRef.id,
      role: 'admin',
      permissions: ['all'],
      status: 'active',
      joinedAt: serverTimestamp() as any,
    };

    await setDoc(membershipRef, membershipData);

    // Return the created church with its ID
    return {
      id: churchRef.id,
      ...churchData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Error creating church:', error);
    throw new Error(error.message || 'Failed to create church');
  }
}

/**
 * Join a church using an invite code
 */
export async function joinChurchWithCode(inviteCode: string): Promise<Church> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to join a church');
  }

  try {
    // Find church by invite code
    const churchesRef = collection(db, 'churches');
    const q = query(churchesRef, where('inviteCode', '==', inviteCode.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Church not found with this invite code');
    }

    const churchDoc = snapshot.docs[0];
    const church = { id: churchDoc.id, ...churchDoc.data() } as Church;

    // Check if user is already a member
    const membershipsRef = collection(db, 'churchMemberships');
    const membershipQuery = query(
      membershipsRef,
      where('userId', '==', user.uid),
      where('churchId', '==', church.id)
    );
    const membershipSnapshot = await getDocs(membershipQuery);

    if (!membershipSnapshot.empty) {
      throw new Error('You are already a member of this church');
    }

    // Create membership for the user (member role by default)
    const membershipRef = doc(collection(db, 'churchMemberships'));
    const membershipData: Omit<ChurchMembership, 'id'> = {
      userId: user.uid,
      churchId: church.id,
      role: 'member',
      permissions: [],
      status: 'active',
      joinedAt: serverTimestamp() as any,
    };

    await setDoc(membershipRef, membershipData);

    return church;
  } catch (error: any) {
    console.error('Error joining church:', error);
    throw new Error(error.message || 'Failed to join church');
  }
}

/**
 * Get all churches the current user is a member of
 */
export async function getUserChurches(): Promise<Church[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view churches');
  }

  try {
    // Get all memberships for the user
    const membershipsRef = collection(db, 'churchMemberships');
    const q = query(
      membershipsRef,
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
    const membershipSnapshot = await getDocs(q);

    // Get church details for each membership
    const churches: Church[] = [];
    for (const membershipDoc of membershipSnapshot.docs) {
      const membership = membershipDoc.data();
      const churchRef = doc(db, 'churches', membership.churchId);
      const churchDoc = await getDoc(churchRef);

      if (churchDoc.exists()) {
        churches.push({
          id: churchDoc.id,
          ...churchDoc.data(),
        } as Church);
      }
    }

    return churches;
  } catch (error: any) {
    console.error('Error fetching user churches:', error);
    throw new Error(error.message || 'Failed to fetch churches');
  }
}

/**
 * Get a specific church by ID
 */
export async function getChurch(churchId: string): Promise<Church> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to view a church');
  }

  try {
    // Check if user has access to this church
    const membershipsRef = collection(db, 'churchMemberships');
    const q = query(
      membershipsRef,
      where('userId', '==', user.uid),
      where('churchId', '==', churchId),
      where('status', '==', 'active')
    );
    const membershipSnapshot = await getDocs(q);

    if (membershipSnapshot.empty) {
      throw new Error('You do not have access to this church');
    }

    // Get church details
    const churchRef = doc(db, 'churches', churchId);
    const churchDoc = await getDoc(churchRef);

    if (!churchDoc.exists()) {
      throw new Error('Church not found');
    }

    return {
      id: churchDoc.id,
      ...churchDoc.data(),
    } as Church;
  } catch (error: any) {
    console.error('Error fetching church:', error);
    throw new Error(error.message || 'Failed to fetch church');
  }
}

/**
 * Update church information
 */
export async function updateChurch(
  churchId: string,
  data: UpdateChurchFormData
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to update a church');
  }

  try {
    // Check if user is an admin
    const membershipsRef = collection(db, 'churchMemberships');
    const q = query(
      membershipsRef,
      where('userId', '==', user.uid),
      where('churchId', '==', churchId),
      where('role', '==', 'admin')
    );
    const membershipSnapshot = await getDocs(q);

    if (membershipSnapshot.empty) {
      throw new Error('You do not have permission to update this church');
    }

    // Update church
    const churchRef = doc(db, 'churches', churchId);
    await updateDoc(churchRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating church:', error);
    throw new Error(error.message || 'Failed to update church');
  }
}

/**
 * Get user's membership details for a specific church
 */
export async function getChurchMembership(churchId: string): Promise<ChurchMembership | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membershipsRef = collection(db, 'churchMemberships');
    const q = query(
      membershipsRef,
      where('userId', '==', user.uid),
      where('churchId', '==', churchId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const membershipDoc = snapshot.docs[0];
    return {
      id: membershipDoc.id,
      ...membershipDoc.data(),
    } as ChurchMembership;
  } catch (error: any) {
    console.error('Error fetching church membership:', error);
    throw new Error(error.message || 'Failed to fetch membership');
  }
}

/**
 * Get all members of a church
 */
export async function getChurchMembers(churchId: string): Promise<ChurchMembership[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    // Verify user has access to this church
    const userMembership = await getChurchMembership(churchId);
    if (!userMembership) {
      throw new Error('You do not have access to this church');
    }

    // Get all members
    const membershipsRef = collection(db, 'churchMemberships');
    const q = query(membershipsRef, where('churchId', '==', churchId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChurchMembership[];
  } catch (error: any) {
    console.error('Error fetching church members:', error);
    throw new Error(error.message || 'Failed to fetch members');
  }
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  membershipId: string,
  newRole: 'admin' | 'leader' | 'volunteer' | 'member'
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membershipRef = doc(db, 'churchMemberships', membershipId);
    await updateDoc(membershipRef, {
      role: newRole,
    });
  } catch (error: any) {
    console.error('Error updating member role:', error);
    throw new Error(error.message || 'Failed to update member role');
  }
}

/**
 * Remove a member from a church
 */
export async function removeMember(membershipId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membershipRef = doc(db, 'churchMemberships', membershipId);
    await updateDoc(membershipRef, {
      status: 'inactive',
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    throw new Error(error.message || 'Failed to remove member');
  }
}

/**
 * Leave a church
 */
export async function leaveChurch(churchId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    const membership = await getChurchMembership(churchId);
    if (!membership) {
      throw new Error('You are not a member of this church');
    }

    // Don't allow the last admin to leave
    if (membership.role === 'admin') {
      const members = await getChurchMembers(churchId);
      const adminCount = members.filter((m) => m.role === 'admin').length;

      if (adminCount <= 1) {
        throw new Error('You cannot leave as you are the only admin. Please assign another admin first.');
      }
    }

    const membershipRef = doc(db, 'churchMemberships', membership.id);
    await updateDoc(membershipRef, {
      status: 'inactive',
    });
  } catch (error: any) {
    console.error('Error leaving church:', error);
    throw new Error(error.message || 'Failed to leave church');
  }
}
