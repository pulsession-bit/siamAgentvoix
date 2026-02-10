import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { UserProfile } from '../contexts/AuthContext';

// Sanitize object to remove undefined values (Firestore doesn't accept them)
const sanitize = (obj: any): any => JSON.parse(JSON.stringify(obj));

/**
 * Sync user profile to Firestore `users` collection
 * Creates or updates the user document keyed by UID
 */
export const syncUserToFirestore = async (user: UserProfile): Promise<void> => {
  if (!user.uid || !user.email) {
    console.warn('syncUserToFirestore: Missing uid or email');
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);

    const userData = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      providerId: user.providerId,
      sessionId: user.sessionId,
      lastLoginAt: user.lastLoginAt,
      metadata: user.metadata || null,
      updatedAt: serverTimestamp(),
    };

    // Check if user exists to preserve createdAt
    const existingDoc = await getDoc(userRef);

    if (existingDoc.exists()) {
      // Update existing user (preserve createdAt)
      await setDoc(userRef, sanitize(userData), { merge: true });
      console.log('User updated in Firestore:', user.email);
    } else {
      // Create new user with createdAt
      await setDoc(userRef, sanitize({
        ...userData,
        createdAt: serverTimestamp(),
      }));
      console.log('User created in Firestore:', user.email);
    }
  } catch (error: any) {
    // Don't throw on permission errors (user might not be fully authenticated yet)
    if (error.code === 'permission-denied') {
      console.warn('Firestore permission denied for user sync');
      return;
    }
    console.error('Error syncing user to Firestore:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore by UID
 */
export const getUserFromFirestore = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;

  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    return null;
  }
};

/**
 * Get user profile from Firestore by email
 * Performs a Firestore query on the `email` field in the `users` collection.
 */
export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  if (!email) return null;

  try {
    const safeEmail = email.toLowerCase().trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', safeEmail), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

