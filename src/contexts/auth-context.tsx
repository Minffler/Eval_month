'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import { mockUsers, mockEmployees } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (id: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('pl-eval-user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.roles[0] || null);
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('pl-eval-user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = React.useCallback(
    async (uniqueId: string, pass: string): Promise<boolean> => {
      if (uniqueId !== pass) return false;

      const employee = mockEmployees.find((e) => e.uniqueId === uniqueId);
      if (!employee) return false;

      const foundUser = mockUsers.find((u) => u.employeeId === employee.id);
      if (!foundUser) return false;

      setUser(foundUser);
      setRole(foundUser.roles[0]);
      localStorage.setItem('pl-eval-user', JSON.stringify(foundUser));
      // No need to push, the page component will react to the state change
      return true;
    },
    []
  );

  const logout = React.useCallback(() => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('pl-eval-user');
    router.push('/login');
  }, [router]);

  const value = { user, role, setRole, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
