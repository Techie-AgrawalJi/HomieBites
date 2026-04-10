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
    try {
      const res = await api.get('/auth/me');
      const nextUser = res.data.data.user;
      setUser(nextUser);
      saveSession({ token: window.localStorage.getItem(tokenStorageKey) || undefined, user: nextUser });
    } catch {
      setUser(null);
      saveSession();
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
