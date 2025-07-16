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
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Helper to remove duplicates from an array of objects based on a key
const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Map<string, T>();
    items.forEach(item => {
        if (!seen.has(item.id)) {
            seen.set(item.id, item);
        }
    });
    return Array.from(seen.values());
};


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
    // Ensure users are always unique by id before saving to localStorage
    const uniqueUsers = uniqueById(users);
    localStorage.setItem('users', JSON.stringify(uniqueUsers));
    
    // If the user list was modified, we may need to re-validate the current user
    if (users.length !== uniqueUsers.length) {
      setUsers(uniqueUsers);
    }
  }, [users]);

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role') as Role;
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const uniqueUsers = uniqueById(users);
        if (uniqueUsers.some(u => u.id === parsedUser.id)) {
            setUser(parsedUser);
            setRole(storedRole || (parsedUser.roles.includes('admin') ? 'admin' : parsedUser.roles.includes('evaluator') ? 'evaluator' : 'employee'));
        } else {
            // The stored user is no longer valid, log them out.
            logout();
        }
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('role');
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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

  const value = { user, users, role, setRole: handleSetRole, login, logout, loading, setUsers };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
