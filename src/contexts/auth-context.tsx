'use client';

import * as React from 'react';
import type { User, Role } from '@/lib/types';
import { mockUsers } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  role: Role;
  setUser: (role: Role) => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>('admin');
  const [user, setUserState] = React.useState<User | null>(null);

  React.useEffect(() => {
    const currentUser = mockUsers.find(u => u.role === role) || null;
    setUserState(currentUser);
  }, [role]);

  const setUser = React.useCallback((newRole: Role) => {
    setRole(newRole);
  }, []);
  
  const value = React.useMemo(() => ({ user, role, setUser }), [user, role, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
