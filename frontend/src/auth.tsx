import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken, clearToken } from './api';

type User = { id: string; full_name?: string; email?: string | null; mobile?: string | null; currency?: string; role?: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (full_name: string, email: string, password: string) => Promise<void>;
  signInMobile: (mobile: string, otp: string, full_name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be inside AuthProvider');
  return v;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const t = await getToken();
      if (!t) {
        setUser(null);
        return;
      }
      const me = await api.me();
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const signInEmail = async (email: string, password: string) => {
    const res = await api.loginEmail({ email, password });
    await setToken(res.token);
    setUser(res.user);
  };

  const signUpEmail = async (full_name: string, email: string, password: string) => {
    const res = await api.registerEmail({ full_name, email, password });
    await setToken(res.token);
    setUser(res.user);
  };

  const signInMobile = async (mobile: string, otp: string, full_name?: string) => {
    const res = await api.verifyOtp({ mobile, otp, full_name });
    await setToken(res.token);
    setUser(res.user);
  };

  const signOut = async () => {
    await clearToken();
    setUser(null);
  };

  const setCurrency = async (code: string) => {
    await api.setCurrency(code);
    setUser((prev) => (prev ? { ...prev, currency: code } : prev));
  };

  return (
    <Ctx.Provider value={{ user, loading, signInEmail, signUpEmail, signInMobile, signOut, refresh, setCurrency }}>
      {children}
    </Ctx.Provider>
  );
}
