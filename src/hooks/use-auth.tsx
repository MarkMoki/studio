"use client";

import type { AuthUser } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { placeholderUsers } from '@/lib/placeholder-data';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email?: string, password?: string) => Promise<void>; // Made params optional
  signOut: () => Promise<void>;
  signUp: (email?: string, password?: string, fullName?: string) => Promise<void>; // Made params optional
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user state
    const timer = setTimeout(() => {
      // To test with a creator user:
      const loggedInUser = placeholderUsers.find(u => u.id === 'user2'); // Amani Art (creator)
      // To test with a non-creator user:
      // const loggedInUser = placeholderUsers.find(u => u.id === 'user1'); // Jane Doe (non-creator)
      
      // To test with no user logged in:
      // const loggedInUser = null;

      if (loggedInUser) {
        setUser(loggedInUser);
      }
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const signIn = async (email?: string, password?: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const loggedInUser = placeholderUsers.find(u => u.email === email) || placeholderUsers[0];
    setUser(loggedInUser);
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setLoading(false);
  };

  const signUp = async (email?: string, password?: string, fullName?: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      email: email || 'newuser@example.com',
      fullName: fullName || 'New User',
      isCreator: false,
      createdAt: new Date().toISOString(),
      // ... other fields if necessary
    };
    setUser(newUser);
    setLoading(false);
  };


  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
