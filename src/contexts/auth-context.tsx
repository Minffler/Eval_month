'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role, Employee } from '@/lib/types';
import { mockEmployees } from '@/lib/data';

const EMPLOYEES_STORAGE_KEY = 'pl_eval_employees';

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (id: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const getAllEmployeesFromStorage = (): Employee[] => {
    if (typeof window === 'undefined') {
        return mockEmployees;
    }
    try {
        const storedData = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            // Data is stored as Record<string, Employee[]>, so we flatten it
            return Object.values(parsedData).flat();
        }
        return mockEmployees;
    } catch {
        return mockEmployees;
    }
}

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
    async (id: string, pass: string): Promise<boolean> => {
      if (id !== pass) return false;

      const allEmployees = getAllEmployeesFromStorage();
      const employee = allEmployees.find((e) => e.uniqueId === id);
      
      if (!employee) return false;

      // Determine roles dynamically
      const roles: Role[] = ['employee'];
      const evaluatorUniqueIds = new Set(allEmployees.map(e => e.evaluatorId).filter(Boolean));
      
      if (evaluatorUniqueIds.has(id)) {
          roles.push('evaluator');
      }
      // Special case for admin - unique ID '1911042'
      if (id === '1911042') {
          if (!roles.includes('admin')) {
            roles.push('admin');
          }
      }
      
      const userToLogin: User = {
        id: `user-from-${employee.id}`,
        employeeId: employee.id,
        uniqueId: employee.uniqueId,
        name: employee.name,
        roles: roles.reverse(), // admin/evaluator preferred as default
        avatar: `https://placehold.co/100x100.png?text=${employee.name.charAt(0)}`,
        title: employee.title,
        department: employee.department,
      };

      setUser(userToLogin);
      setRole(userToLogin.roles[0]);
      localStorage.setItem('pl-eval-user', JSON.stringify(userToLogin));
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
