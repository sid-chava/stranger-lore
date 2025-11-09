import { useUser, useStackApp } from '@stackframe/react';
import { useEffect, useState, useCallback } from 'react';
import { getCurrentUser } from '../services/api';

// Simplified auth context using Stack React hooks
export function useAuth() {
  const app = useStackApp();
  const user = useUser({ or: 'return-null' });
  const [profile, setProfile] = useState<{ roles: string[]; username?: string } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchProfile = useCallback(() => {
    if (!user || !app) {
      setProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    getCurrentUser(app)
      .then((data: any) => {
        setProfile({
          roles: data.roles || [],
          username: data.username || undefined,
        });
      })
      .catch((error) => {
        console.error('Failed to fetch user profile:', error);
        setProfile(null);
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [user, app]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async () => {
    await app.redirectToSignIn();
  };

  const logout = async () => {
    await user?.signOut();
    setProfile(null);
  };

  // Get role indicator letter
  const getRoleIndicator = (roles: string[]): string | null => {
    if (roles.includes('admin')) return 'A';
    if (roles.includes('editor')) return 'E';
    if (roles.includes('reader')) return 'R';
    return null;
  };

  const currentRoles = profile?.roles ?? [];
  const hasUsername = Boolean(profile?.username);
  const needsUsername = Boolean(user && !hasUsername);

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmail || undefined,
      name: user.displayName || undefined,
      roles: currentRoles,
      username: profile?.username,
    } : null,
    isAuthenticated: !!user,
    isLoading: isLoadingProfile,
    login,
    logout,
    roleIndicator: getRoleIndicator(currentRoles),
    hasUsername,
    needsUsername,
    refreshProfile: fetchProfile,
  };
}
