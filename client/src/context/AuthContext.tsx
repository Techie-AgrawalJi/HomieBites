import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { tokenStorageKey } from '../lib/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'provider' | 'superadmin';
  city: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const userStorageKey = 'homiebites_user';

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(userStorageKey);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const readStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(tokenStorageKey);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const saveSession = (session?: { token?: string; user?: User | null }) => {
    if (typeof window === 'undefined') return;
    if (!session?.token) {
      window.localStorage.removeItem(tokenStorageKey);
      window.localStorage.removeItem(userStorageKey);
      return;
    }

    window.localStorage.setItem(tokenStorageKey, session.token);
    if (session.user) {
      window.localStorage.setItem(userStorageKey, JSON.stringify(session.user));
    }
  };

  const refetch = async () => {
    const token = readStoredToken();
    const storedUser = readStoredUser();
    if (!token) {
      setUser(storedUser);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const nextUser = res.data.data.user;
      setUser(nextUser);
      saveSession({ token, user: nextUser });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setUser(null);
        saveSession();
      } else {
        setUser(storedUser);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const nextUser = res.data.data as User;
    saveSession({ token: res.data?.data?.token, user: nextUser });
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    saveSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
