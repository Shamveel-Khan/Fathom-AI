'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  mutateUser: (newUser?: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch {}
  }, []);

  // On mount, check current session
  useEffect(() => {
    fetchCurrentUser().finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  const mutateUser = useCallback(
    (newUser?: User | null) => {
      if (newUser !== undefined) {
        setUser(newUser);
      } else {
        fetchCurrentUser();
      }
    },
    [fetchCurrentUser]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, error: data.error };
    },
    [router]
  );

  // Quick login for demo: directly call login with preset credentials
  const quickLogin = useCallback(
    async (userId: string) => {
      const credentials: Record<string, { email: string; password: string }> = {
        'user-1': { email: 'sarah@fathom.ai', password: 'password123' },
        'user-2': { email: 'alex@fathom.ai', password: 'password123' },
      };
      const creds = credentials[userId];
      if (!creds) return;
      await login(creds.email, creds.password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, quickLogin, logout, mutateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
