'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User, Role } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their profile from Firestore.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser(userData);
          // Set role based on the stored roles, prioritizing admin/evaluator
          const preferredRole = userData.roles.includes('admin') ? 'admin' : userData.roles.includes('evaluator') ? 'evaluator' : 'employee';
          setRole(preferredRole);
        } else {
          // This case might happen if a user exists in Auth but not in Firestore.
          // For this app, we'll log them out.
          await firebaseSignOut(auth);
          setUser(null);
          setRole(null);
        }
      } else {
        // User is signed out
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = React.useCallback(
    async (id: string, pass: string): Promise<boolean> => {
      try {
        // Firebase Auth requires an email format, so we append a dummy domain.
        const email = `${id}@example.com`;
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;

        // After successful sign-in, check for/create user profile in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // If profile doesn't exist, create a basic one.
          // This would typically be expanded upon with real data.
          const newUser: User = {
            id: firebaseUser.uid,
            employeeId: id,
            uniqueId: id,
            name: id, // Placeholder name
            roles: ['employee'], // Default role
            avatar: `https://placehold.co/100x100.png?text=${id.charAt(0)}`,
            title: '팀원', // Placeholder
            department: '미지정' // Placeholder
          };
          await setDoc(userDocRef, newUser);
          setUser(newUser);
          setRole('employee');
        }
        return true;
      } catch (error) {
        console.error("Firebase login failed:", error);
        return false;
      }
    },
    []
  );

  const logout = React.useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout failed:", error);
    }
  }, [router]);

  const handleSetRole = (newRole: Role) => {
    if (user && user.roles.includes(newRole)) {
      setRole(newRole);
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
