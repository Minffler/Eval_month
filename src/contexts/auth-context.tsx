'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import { mockUsers } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  role: Role;
  login: (id: string, pass:string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [allUsers, setAllUsers] = React.useState<User[]>(() => {
    if (typeof window === 'undefined') return mockUsers;
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : mockUsers;
  });
  const [role, setRole] = React.useState<Role>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    // Check if user info is in localStorage
    try {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role') as Role;
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(storedRole || (parsedUser.roles.includes('admin') ? 'admin' : parsedUser.roles.includes('evaluator') ? 'evaluator' : 'employee'));
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('role');
    }
    setLoading(false);
  }, []);
  
  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'users' && event.newValue) {
        try {
          const newUsers = JSON.parse(event.newValue);
          setAllUsers(newUsers);
        } catch (e) {
          console.error('Error parsing users from storage event', e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = React.useCallback(
    async (id: string, pass: string): Promise<boolean> => {
      if (pass !== '1') return false;

      const foundUser = allUsers.find(u => u.uniqueId === id);

      if (foundUser) {
        setUser(foundUser);
        const preferredRole = foundUser.roles.includes('admin') ? 'admin' : foundUser.roles.includes('evaluator') ? 'evaluator' : 'employee';
        setRole(preferredRole);
        localStorage.setItem('user', JSON.stringify(foundUser));
        localStorage.setItem('role', preferredRole);
        return true;
      }
      return false;
    },
    [allUsers]
  );

  const logout = React.useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    router.push('/login');
  }, [router]);

  const handleSetRole = (newRole: Role) => {
    if (user && user.roles.includes(newRole!)) {
      setRole(newRole);
      localStorage.setItem('role', newRole!);
    }
  }

  const value = { user, allUsers, role, setRole: handleSetRole, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
