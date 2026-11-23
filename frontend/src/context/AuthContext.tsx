import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';

interface AuthState {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token'),
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/login', {
      email,
      password,
    });
    const t = res.data.access_token;
    localStorage.setItem('token', t);
    setToken(t);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string }>('/auth/register', {
      email,
      password,
    });
    const t = res.data.access_token;
    localStorage.setItem('token', t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, login, register, logout }),
    [token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
