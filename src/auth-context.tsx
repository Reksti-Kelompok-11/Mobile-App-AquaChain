import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '@/src/api';

export type AuthUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  setAuthenticated: () => void;
  clearAuth: () => void;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' ? value : null;
}

export function normalizeAuthUser(payload: unknown): AuthUser | null {
  const record = asRecord(payload);
  if (!record) return null;

  const data = asRecord(record.data);
  const dataUser = data ? asRecord(data.user) : null;
  const directUser = asRecord(record.user);

  const candidate = dataUser ?? directUser ?? data ?? record;

  const name =
    readString(candidate, 'name') ??
    readString(candidate, 'full_name') ??
    readString(candidate, 'username');
  const email = readString(candidate, 'email');
  const id = readString(candidate, 'id') ?? readString(candidate, 'user_id');

  if (!name && !email && !id) return null;

  return { id, name, email };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const response = await api.me();
    const normalized = normalizeAuthUser(response);
    setUser(normalized);
    setIsAuthenticated(true);
    return normalized;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        await refreshUser();
      } catch {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const setAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isAuthReady,
      setAuthenticated,
      clearAuth,
      setUser,
      refreshUser,
    }),
    [clearAuth, isAuthenticated, isAuthReady, refreshUser, setAuthenticated, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
