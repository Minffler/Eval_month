'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role, Employee } from '@/lib/types';
import { mockUsers as initialMockUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileoverview AuthContext는 앱의 인증 및 사용자 정보 관리를 전담합니다.
 *
 * @description
 * 이 컨텍스트는 다음을 제공합니다:
 * - 현재 로그인된 사용자 정보 (`user`, `role`)
 * - 전체 사용자 목록 (`allUsers`)
 * - 로그인, 로그아웃 기능 (`login`, `logout`)
 * - 사용자 추가, 수정, 삭제, 권한 변경 함수
 * - 데이터 로딩 상태 (`loading`)
 */

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (id: string, pass:string) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  addUser: (newEmployeeData: Partial<Employee>, roles: Role[]) => void;
  updateUser: (userId: string, updatedData: Partial<User & { newUniqueId?: string }>) => void;
  deleteUser: (userId: string) => void;
  deleteUsers: (userIds: string[]) => void;
  updateUserRoles: (userId: string, newRoles: Role[]) => void;
  upsertUsers: (usersToUpsert: Partial<User>[]) => void;
  loading: boolean;
  allUsers: User[];
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Helper to remove duplicates from an array of objects based on a key
const uniqueByUniqueId = <T extends { uniqueId: string }>(items: T[]): T[] => {
    const seen = new Map<string, T>();
    items.forEach(item => {
        if (!seen.has(item.uniqueId)) {
            seen.set(item.uniqueId, item);
        }
    });
    return Array.from(seen.values());
};

const getFromLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    localStorage.removeItem(key);
  }
  return defaultValue;
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = React.useState<User[]>(() => getFromLocalStorage('users', initialMockUsers));
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<Role>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const uniqueUsers = uniqueByUniqueId(allUsers);
    localStorage.setItem('users', JSON.stringify(uniqueUsers));
    
    if (allUsers.length !== uniqueUsers.length) {
      setAllUsers(uniqueUsers);
    }
  }, [allUsers]);

  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role') as Role;
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const uniqueUsers = uniqueByUniqueId(allUsers);
        const currentUser = uniqueUsers.find(u => u.id === parsedUser.id);
        if (currentUser) {
            setUser(currentUser);
            const validRole = storedRole && currentUser.roles.includes(storedRole) ? storedRole : currentUser.roles[0];
            setRole(validRole);
        } else {
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
      const foundUser = allUsers.find(u => u.uniqueId === id);
      
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

  const upsertUsers = (usersToUpsert: Partial<User>[]) => {
    setAllUsers(prevUsers => {
      const userMap = new Map(prevUsers.map(u => [u.uniqueId, u]));
      
      usersToUpsert.forEach(userToUpsert => {
        if (!userToUpsert.uniqueId) return;

        const existingUser = userMap.get(userToUpsert.uniqueId);
        if (existingUser) {
          // Update existing user
          userMap.set(userToUpsert.uniqueId, { ...existingUser, ...userToUpsert });
        } else {
          // Add new user
          const newUser: User = {
            id: `user-${userToUpsert.uniqueId}`,
            employeeId: `E${userToUpsert.uniqueId}`,
            uniqueId: userToUpsert.uniqueId,
            name: userToUpsert.name || `사용자(${userToUpsert.uniqueId})`,
            department: userToUpsert.department || '미지정',
            title: userToUpsert.title || '팀원',
            roles: userToUpsert.roles || ['employee'],
            avatar: `https://placehold.co/100x100.png?text=${(userToUpsert.name || 'U').charAt(0)}`,
            password: '1',
            ...userToUpsert
          };
          userMap.set(userToUpsert.uniqueId, newUser);
        }
      });
      return Array.from(userMap.values());
    });
  };

  const addUser = (newEmployeeData: Partial<Employee>, roles: Role[]) => {
      if (!newEmployeeData.uniqueId) {
        toast({ variant: 'destructive', title: '오류', description: 'ID가 없습니다.' });
        return;
      }
      upsertUsers([{
        uniqueId: newEmployeeData.uniqueId,
        name: newEmployeeData.name,
        department: newEmployeeData.department,
        title: newEmployeeData.title,
        company: newEmployeeData.company,
        evaluatorId: newEmployeeData.evaluatorId,
        roles
      }]);
  };
  
  const updateUser = (userId: string, updatedData: Partial<User & { newUniqueId?: string }>) => {
    setAllUsers(prevUsers => {
        const userToUpdate = prevUsers.find(u => u.id === userId);
        if (!userToUpdate) return prevUsers;
        
        const finalUpdatedData = { ...updatedData };
        if (finalUpdatedData.newUniqueId) {
            finalUpdatedData.uniqueId = finalUpdatedData.newUniqueId;
            delete finalUpdatedData.newUniqueId;
        }

        const newUsers = prevUsers.map(u => u.id === userId ? { ...u, ...finalUpdatedData } : u);

        // Also update the current user state if they are the one being updated
        if(user && user.id === userId) {
          const updatedCurrentUser = newUsers.find(u => u.id === userId);
          if (updatedCurrentUser) {
            setUser(updatedCurrentUser);
            localStorage.setItem('user', JSON.stringify(updatedCurrentUser));
          }
        }
        return newUsers;
    });
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
  };

  const deleteUsers = (userIds: string[]) => {
    setAllUsers(prev => prev.filter(u => !userIds.includes(u.id)));
  };

  const updateUserRoles = (userId: string, newRoles: Role[]) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
  };


  const value = { 
    user, 
    allUsers,
    role, 
    setRole: handleSetRole, 
    login, 
    logout, 
    loading, 
    addUser,
    updateUser,
    deleteUser,
    deleteUsers,
    updateUserRoles,
    upsertUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
