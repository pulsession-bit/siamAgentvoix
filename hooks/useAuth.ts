import { useState, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth, signInWithGoogle } from '../services/firebaseConfig';

interface UseAuthReturn {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  login: () => Promise<string | null>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const login = useCallback(async (): Promise<string | null> => {
    try {
      const user = await signInWithGoogle();
      if (user?.email) {
        setUserEmail(user.email);
        return user.email;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Erreur lors de la connexion Google.');
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserEmail(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  return {
    userEmail,
    setUserEmail,
    login,
    logout,
  };
}
