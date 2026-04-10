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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const saveToken = (token?: string) => {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage.setItem(tokenStorageKey, token);
    } else {
      window.localStorage.removeItem(tokenStorageKey);
    }
  };

  const refetch = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    saveToken(res.data?.data?.token);
    setUser(res.data.data);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    saveToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
