'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import { mockEmployees } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (id: string, pass:string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: 'user-1', employeeId: 'E1911042', uniqueId: '1911042', name: '김관리', roles: ['admin', 'evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png?text=A', title: '인사총무팀장', department: '인사총무팀' },
  { id: 'user-2', employeeId: 'E0000002', uniqueId: '0000002', name: '박평가', roles: ['evaluator', 'employee'], avatar: 'https://placehold.co/100x100.png?text=E', title: '개발팀장', department: '개발팀' },
  { id: 'user-3', employeeId: 'E0000003', uniqueId: '0000003', name: '이주임', roles: ['employee'], avatar: 'https://placehold.co/100x100.png?text=E', title: '주임', department: '개발팀' },
];


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
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

  const login = React.useCallback(
    async (id: string, pass: string): Promise<boolean> => {
      let foundUser: User | undefined;
      
      // Simple mock auth logic, can be replaced with real auth
      if (id === 'admin' && pass === '1') {
        foundUser = mockUsers.find(u => u.roles.includes('admin'));
      } else if (id === 'evaluator' && pass === '1') {
        foundUser = mockUsers.find(u => u.roles.includes('evaluator') && !u.roles.includes('admin'));
      } else if (id === 'employee' && pass === '1') {
        foundUser = mockUsers.find(u => u.roles.length === 1 && u.roles[0] === 'employee');
      } else {
        foundUser = mockUsers.find(u => u.uniqueId === id);
      }
      
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
    []
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

  const value = { user, role, setRole: handleSetRole, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
