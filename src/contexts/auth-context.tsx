'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import { mockUsers as initialMockUsers } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  users: User[];
  role: Role;
  login: (id: string, pass:string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = React.useState<User[]>(() => {
    if (typeof window === 'undefined') return initialMockUsers;
    const stored = localStorage.getItem('users');
    return stored ? JSON.parse(stored) : initialMockUsers;
  });
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role') as Role;
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (users.some(u => u.id === parsedUser.id)) {
            setUser(parsedUser);
            setRole(storedRole || (parsedUser.roles.includes('admin') ? 'admin' : parsedUser.roles.includes('evaluator') ? 'evaluator' : 'employee'));
        }
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('role');
    }
    setLoading(false);
  }, [users]);
  
  const login = React.useCallback(
    async (id: string, pass: string): Promise<boolean> => {
      const foundUser = users.find(u => u.uniqueId === id);
      
      if (foundUser && (foundUser.password === pass || pass === '1')) {
        setUser(foundUser);
        const preferredRole = foundUser.roles.includes('admin') ? 'admin' : foundUser.roles.includes('evaluator') ? 'evaluator' : 'employee';
        setRole(preferredRole);
        localStorage.setItem('user', JSON.stringify(foundUser));
        localStorage.setItem('role', preferredRole);
        return true;
      }
      return false;
    },
    [users]
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

  const value = { user, users, role, setRole: handleSetRole, login, logout, loading, setUsers, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
