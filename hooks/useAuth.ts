import { useAuthContext, UserProfile } from '../contexts/AuthContext';

/**
 * Hook to access authentication state and methods
 * This is a convenience wrapper around useAuthContext
 *
 * @example
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   console.log('Logged in as:', user.email);
 * }
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    login,
    logout,
    refreshSession,
  } = useAuthContext();

  // Backward compatibility: expose userEmail as before
  const userEmail = user?.email || null;

  // Convenience setter (no-op, state is managed by context)
  const setUserEmail = (_email: string | null) => {
    console.warn('setUserEmail is deprecated. Use login() and logout() instead.');
  };

  return {
    // New API
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    refreshSession,

    // Original API (backward compatible)
    userEmail,
    setUserEmail,
    login: async (): Promise<string | null> => {
      const profile = await login();
      return profile?.email || null;
    },
    logout,
  };
}

// Re-export types for convenience
export type { UserProfile };
