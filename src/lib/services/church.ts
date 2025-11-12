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
import type { Church, ChurchMembership, ChurchMembershipWithUser } from '@/types/church';
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
    // Use composite key: userId_churchId for efficient lookups
    const membershipId = `${user.uid}_${churchRef.id}`;
    const membershipRef = doc(db, 'churchMemberships', membershipId);
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

    // ACCOUNT LINKING: Check if there's an existing person record with matching email
    // This handles the scenario where an admin added a person before they created an account
    const userEmail = user.email?.toLowerCase();
    if (userEmail) {
      const emailQuery = query(
        membershipsRef,
        where('churchId', '==', church.id),
        where('email', '==', userEmail),
        where('userId', '==', null),
        where('status', '==', 'active')
      );
      const emailSnapshot = await getDocs(emailQuery);

      // If we found a matching person record without a userId, link it
      if (!emailSnapshot.empty) {
        const existingMembershipDoc = emailSnapshot.docs[0];
        const existingMembership = existingMembershipDoc.data();

        // Update the existing membership with the userId
        await updateDoc(existingMembershipDoc.ref, {
          userId: user.uid,
          updatedAt: serverTimestamp(),
        });

        // Return the church - account has been linked
        return church;
      }
    }

    // No existing person record found - create new membership
    // Use composite key: userId_churchId for efficient lookups
    const membershipId = `${user.uid}_${church.id}`;
    const membershipRef = doc(db, 'churchMemberships', membershipId);
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
    // Use composite key for direct document access (more efficient than query)
    const membershipId = `${user.uid}_${churchId}`;
    const membershipRef = doc(db, 'churchMemberships', membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      return null;
    }

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

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate() : new Date(data.joinedAt),
      };
    }) as ChurchMembership[];
  } catch (error: any) {
    console.error('Error fetching church members:', error);
    throw new Error(error.message || 'Failed to fetch members');
  }
}

/**
 * Get all members of a church with user information
 */
export async function getChurchMembersWithUsers(
  churchId: string
): Promise<ChurchMembershipWithUser[]> {
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

    // Fetch user data for each membership
    const membersWithUsers = await Promise.all(
      snapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();

        let userName = 'Unknown User';
        let userEmail = '';

        // Check if member has a linked user account
        if (memberData.userId) {
          // Fetch user data from users collection
          const userDoc = await getDoc(doc(db, 'users', memberData.userId));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = `${userData.profile?.firstName || ''} ${userData.profile?.lastName || ''}`.trim();
            userEmail = userData.email || '';
          } else {
            // Fallback to Firebase Auth user data
            userEmail = memberData.userId;
          }
        } else {
          // Member doesn't have an account yet - use firstName/lastName
          userName = `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() || 'Unnamed Person';
          userEmail = memberData.email || '';
        }

        return {
          id: memberDoc.id,
          ...memberData,
          joinedAt: memberData.joinedAt?.toDate ? memberData.joinedAt.toDate() : new Date(memberData.joinedAt),
          userName: userName || userEmail || 'Unnamed',
          userEmail,
        } as ChurchMembershipWithUser;
      })
    );

    return membersWithUsers;
  } catch (error: any) {
    console.error('Error fetching church members with users:', error);
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
    // Get the membership to find out which church it belongs to
    const membershipRef = doc(db, 'churchMemberships', membershipId);
    const membershipDoc = await getDoc(membershipRef);

    if (!membershipDoc.exists()) {
      throw new Error('Membership not found');
    }

    const membership = membershipDoc.data();
    const churchId = membership.churchId;
    const targetUserId = membership.userId;

    // Verify that the current user is a leader or admin of this church
    const userMembership = await getChurchMembership(churchId);
    if (!userMembership) {
      throw new Error('You do not have access to this church');
    }

    const isAdmin = userMembership.role === 'admin';
    const isLeader = userMembership.role === 'leader' || isAdmin;

    if (!isLeader) {
      throw new Error('You must be a leader or admin to update member roles');
    }

    // Rule 1: Users cannot change their own role
    if (targetUserId === user.uid) {
      throw new Error('You cannot change your own role');
    }

    // Rule 3: Leaders can only change roles of members and volunteers
    const targetRole = membership.role;
    if (!isAdmin && (targetRole === 'admin' || targetRole === 'leader')) {
      throw new Error('Leaders can only change roles of members and volunteers');
    }

    // Leaders can only assign member or volunteer roles
    // Only admins can assign leader or admin roles
    if (!isAdmin && (newRole === 'admin' || newRole === 'leader')) {
      throw new Error('Only admins can assign leader or admin roles');
    }

    // Update the role
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

/**
 * Update custom field values for a member
 */
export async function updateMemberCustomFields(
  membershipId: string,
  customFieldValues: Record<string, any>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    // Filter out undefined values - Firestore doesn't support them
    const sanitizedValues: Record<string, any> = {};
    for (const [key, value] of Object.entries(customFieldValues)) {
      if (value !== undefined) {
        sanitizedValues[key] = value;
      }
    }

    const membershipRef = doc(db, 'churchMemberships', membershipId);
    await updateDoc(membershipRef, {
      customFieldValues: sanitizedValues,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error updating custom fields:', error);
    throw new Error(error.message || 'Failed to update custom fields');
  }
}

/**
 * Create a new person/member without an account
 */
export async function createPersonWithoutAccount(
  churchId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    role?: 'admin' | 'leader' | 'volunteer' | 'member';
    customFieldValues?: Record<string, any>;
  }
): Promise<ChurchMembership> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in');
  }

  try {
    // Verify user has permission to add members (admin or leader)
    const userMembership = await getChurchMembership(churchId);
    if (!userMembership || (userMembership.role !== 'admin' && userMembership.role !== 'leader')) {
      throw new Error('You do not have permission to add members');
    }

    // Check if email already exists in this church (if email provided)
    if (data.email) {
      const membershipsRef = collection(db, 'churchMemberships');
      const emailQuery = query(
        membershipsRef,
        where('churchId', '==', churchId),
        where('email', '==', data.email.toLowerCase()),
        where('status', '==', 'active')
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        throw new Error('A person with this email already exists in this church');
      }
    }

    // Create membership without userId
    const membershipRef = doc(collection(db, 'churchMemberships'));
    const membershipData: any = {
      churchId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email?.toLowerCase() || null,
      userId: null,
      role: data.role || 'member',
      permissions: [],
      customFieldValues: data.customFieldValues || {},
      status: 'active',
      joinedAt: serverTimestamp(),
    };

    await setDoc(membershipRef, membershipData);

    return {
      id: membershipRef.id,
      ...membershipData,
      joinedAt: new Date(),
    } as ChurchMembership;
  } catch (error: any) {
    console.error('Error creating person:', error);
    throw new Error(error.message || 'Failed to create person');
  }
}
