import { useUser, useStackApp } from '@stackframe/react';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/api';

interface UserWithRoles {
  id: string;
  email?: string;
  name?: string;
  roles: string[];
}

// Simplified auth context using Stack React hooks
export function useAuth() {
  const app = useStackApp();
  const user = useUser({ or: 'return-null' });
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  useEffect(() => {
    if (user && app) {
      setIsLoadingRoles(true);
      getCurrentUser(app)
        .then((data: any) => {
          setUserRoles(data.roles || []);
        })
        .catch((error) => {
          console.error('Failed to fetch user roles:', error);
          setUserRoles([]);
        })
        .finally(() => {
          setIsLoadingRoles(false);
        });
    } else {
      setUserRoles([]);
    }
  }, [user, app]);

  const login = async () => {
    await app.redirectToSignIn();
  };

  const logout = async () => {
    await app.signOut();
    setUserRoles([]);
  };

  // Get role indicator letter
  const getRoleIndicator = (roles: string[]): string | null => {
    if (roles.includes('admin')) return 'A';
    if (roles.includes('editor')) return 'E';
    if (roles.includes('reader')) return 'R';
    return null;
  };

  return {
    user: user ? {
      id: user.id,
      email: user.primaryEmail || undefined,
      name: user.displayName || undefined,
      roles: userRoles,
    } : null,
    isAuthenticated: !!user,
    isLoading: isLoadingRoles,
    login,
    logout,
    roleIndicator: getRoleIndicator(userRoles),
  };
}

