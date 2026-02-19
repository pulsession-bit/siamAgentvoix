import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, signInWithGoogle } from '../services/firebaseConfig';
import { syncUserToFirestore } from '../services/userService';

// Constants
const USER_SESSION_KEY = 'siam_visa_pro_user_session';
const AUDIT_SESSION_KEY = 'siam_visa_pro_session_v2';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
  sessionId: string;
  createdAt: string;
  lastLoginAt: string;
  expiresAt: number;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  login: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile | null>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<UserProfile | null>;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: Generate unique session ID
const generateSessionId = (): string => {
  return `${Date.now()}-${crypto.randomUUID()}`;
};

// Helper: Save session to localStorage
const saveSessionToStorage = (user: UserProfile): void => {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
};

// Helper: Load session from localStorage
const loadSessionFromStorage = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(USER_SESSION_KEY);
    if (!data) return null;

    const user: UserProfile = JSON.parse(data);

    // Check expiration
    if (user.expiresAt < Date.now()) {
      localStorage.removeItem(USER_SESSION_KEY);
      console.log('Session expired, clearing localStorage');
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to load session from localStorage:', error);
    localStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
};

// Helper: Clear all session data
const clearAllSessionData = (): void => {
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(AUDIT_SESSION_KEY);
  // Also clear v1 for backward compatibility
  localStorage.removeItem('siam_visa_pro_session_v1');
};

// Helper: Convert Firebase User to UserProfile
const firebaseUserToProfile = (
  firebaseUser: FirebaseUser,
  existingSessionId?: string
): UserProfile => {
  const now = new Date().toISOString();
  const sessionId = existingSessionId || generateSessionId();

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    providerId: firebaseUser.providerData[0]?.providerId || 'unknown',
    sessionId,
    createdAt: now,
    lastLoginAt: now,
    expiresAt: Date.now() + SESSION_DURATION,
    metadata: {
      creationTime: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime,
    },
  };
};

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  // Derived state
  const isAuthenticated = !!user;
  const sessionId = user?.sessionId || null;

  // Initialize: Restore session from localStorage + validate with Firebase
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // 1. Try to restore from localStorage (instant)
    const cachedUser = loadSessionFromStorage();
    if (cachedUser) {
      setUser(cachedUser);
      console.log('Session restored from localStorage:', cachedUser.email);
    }

    // 2. Listen to Firebase auth state (background validation)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase confirms user is logged in
        const existingSessionId = cachedUser?.sessionId;
        const profile = firebaseUserToProfile(firebaseUser, existingSessionId);

        setUser(profile);
        saveSessionToStorage(profile);

        // Sync to Firestore (non-blocking)
        syncUserToFirestore(profile).catch(console.error);

        console.log('Firebase auth confirmed:', profile.email);
      } else if (cachedUser) {
        // Firebase says no user, but we have cached data
        // Session might be invalid server-side
        console.log('Firebase session invalid, clearing local cache');
        clearAllSessionData();
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with Google
  const login = useCallback(async (): Promise<UserProfile | null> => {
    try {
      setIsLoading(true);
      const firebaseUser = await signInWithGoogle();

      if (!firebaseUser) {
        throw new Error('Login failed: No user returned');
      }

      const profile = firebaseUserToProfile(firebaseUser);

      // Save locally
      setUser(profile);
      saveSessionToStorage(profile);

      // Sync to Firestore
      await syncUserToFirestore(profile);

      console.log('Login successful:', profile.email);
      return profile;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Erreur lors de la connexion Google.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout: Clean everything
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // 1. Sign out from Firebase
      await signOut(auth);

      // 2. Clear local state
      setUser(null);

      // 3. Clear all localStorage
      clearAllSessionData();

      console.log('Logout complete');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if Firebase fails
      setUser(null);
      clearAllSessionData();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh session (extend expiration)
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!user) return;

    const refreshedUser: UserProfile = {
      ...user,
      lastLoginAt: new Date().toISOString(),
      expiresAt: Date.now() + SESSION_DURATION,
    };

    setUser(refreshedUser);
    saveSessionToStorage(refreshedUser);

    // Sync to Firestore
    await syncUserToFirestore(refreshedUser);
  }, [user]);

  // Login with Email
  const loginWithEmail = useCallback(async (email: string, password: string): Promise<UserProfile | null> => {
    try {
      setIsLoading(true);
      const { signInWithEmail } = await import('../services/firebaseConfig');
      const userCredential = await signInWithEmail(email, password);
      const firebaseUser = userCredential.user;

      const profile = firebaseUserToProfile(firebaseUser);
      setUser(profile);
      saveSessionToStorage(profile);
      await syncUserToFirestore(profile);
      return profile;
    } catch (error) {
      console.error('Email Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Signup with Email
  const signupWithEmail = useCallback(async (email: string, password: string, name: string): Promise<UserProfile | null> => {
    try {
      setIsLoading(true);
      const { createAccount, updateUserProfile } = await import('../services/firebaseConfig');
      const userCredential = await createAccount(email, password);
      const firebaseUser = userCredential.user;

      if (name) {
        try {
          await updateUserProfile(firebaseUser, { displayName: name });
          // Manually update the user object before creating profile
          // Note: firebaseUser is read-only usually, but profile creation reads it
        } catch (e) {
          console.warn("Name update failed", e);
        }
      }

      const profile = firebaseUserToProfile(firebaseUser);
      // Manually set displayName if it wasn't picked up
      if (name && !profile.displayName) profile.displayName = name;

      setUser(profile);
      saveSessionToStorage(profile);
      await syncUserToFirestore(profile);
      return profile;
    } catch (error) {
      console.error('Email Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    login,
    logout,
    refreshSession,
    loginWithEmail,
    signupWithEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export storage keys for use in other services
export { USER_SESSION_KEY, AUDIT_SESSION_KEY };
