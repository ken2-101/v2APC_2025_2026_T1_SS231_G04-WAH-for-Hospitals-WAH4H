import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from './RoleContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://glowing-orbit-wrgjv6x7jpq929j9p-8000.app.github.dev';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/accounts/login/', {
        email,
        password,
      });

      const { tokens, user: userData } = res.data;

      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role);

      setUser(userData);

      toast({
        title: 'Welcome back!',
        description: `${userData.firstName} ${userData.lastName}`,
      });

      return true;
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.response?.data?.detail || 'Invalid credentials',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/accounts/register/', {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword, // 🔥 REQUIRED
        role: data.role,
      });

      toast({
        title: 'Registration successful',
        description: 'You may now log in',
      });

      return true;
    } catch (err: any) {
      console.error('REGISTER ERROR:', err.response?.data);

      toast({
        title: 'Registration failed',
        description:
          err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          'Unable to register',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();

    toast({
      title: 'Logged out',
      description: 'You have been logged out',
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
