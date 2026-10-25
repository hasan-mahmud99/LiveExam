'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  username: string;
  role: 'ADMIN' | 'STUDENT';
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount - check localStorage first for instant display
  useEffect(() => {
    try {
      const cached = localStorage.getItem('liveexam_auth_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          setUser(parsed);
        }
      }
    } catch {}

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('liveexam_auth_user', JSON.stringify(data.user));
            localStorage.setItem('liveexam_user_name', data.user.display_name);
            localStorage.setItem('liveexam_user_role', data.user.role);
          } else {
            // Only clear if localStorage didn't specify remember
            const remembered = localStorage.getItem('liveexam_remember');
            if (!remembered) {
              setUser(null);
              localStorage.removeItem('liveexam_auth_user');
            }
          }
        }
      } catch (err) {
        console.error('Failed to check auth:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (rememberMe) {
          localStorage.setItem('liveexam_remember', 'true');
        } else {
          localStorage.removeItem('liveexam_remember');
        }
        localStorage.setItem('liveexam_auth_user', JSON.stringify(data.user));
        localStorage.setItem('liveexam_user_name', data.user.display_name);
        localStorage.setItem('liveexam_user_role', data.user.role);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'ভুল ইউজারনেম বা পাসওয়ার্ড' };
      }
    } catch (err) {
      return { success: false, error: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('liveexam_remember');
      localStorage.removeItem('liveexam_auth_user');
      localStorage.removeItem('liveexam_user_name');
      localStorage.removeItem('liveexam_user_role');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

