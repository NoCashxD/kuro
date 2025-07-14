'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginStep, setLoginStep] = useState(1);
  const [selectedUsername, setSelectedUsername] = useState('');
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, step = 1) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, step }),
      });

      const data = await response.json();

      if (response.ok) {
        if (step === 1) {
          // Username verified, proceed to password step
          setSelectedUsername(username);
          setLoginStep(2);
          toast.success('Username verified');
        } else if (step === 2) {
          // Login successful
          setUser(data.user);
          setLoginStep(1);
          setSelectedUsername('');
          toast.success('Login successful');
          router.push('/dashboard');
        }
        return { success: true, data };
      } else {
        toast.error(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error');
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      setLoginStep(1);
      setSelectedUsername('');
      toast.success('Logout successful');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const hasPermission = (requiredLevel) => {
    if (!user) return false;
    return user.level <= requiredLevel;
  };

  const isDev = () => {
    return user?.level === 0;
  };

  const isOwner = () => {
    return user?.level <= 1;
  };

  const isAdmin = () => {
    return user?.level <= 2;
  };

  const isReseller = () => {
    return user?.level <= 3;
  };

  const value = {
    user,
    loading,
    loginStep,
    selectedUsername,
    login,
    logout,
    hasPermission,
    isDev,
    isOwner,
    isAdmin,
    isReseller,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 