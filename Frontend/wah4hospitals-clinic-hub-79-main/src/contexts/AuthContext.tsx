import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from './RoleContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://crispy-system-px6qj9j4w5p2rj7-8000.app.github.dev'; // fallback

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
  register: (userData: RegisterData) => Promise<boolean>;
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

  // Load user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // Axios instance with credentials support
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // needed if your backend uses cookies
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/accounts/api/login/', { email, password });

      const { tokens, user: userData } = res.data;

      // Save tokens and user info
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
      if (data.password !== data.confirmPassword) {
        toast({
          title: 'Registration failed',
          description: 'Passwords do not match',
          variant: 'destructive',
        });
        return false;
      }

      const res = await axiosInstance.post('/accounts/register', {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      const { tokens, user: userData } = res.data;

      // Save tokens and user info
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.role);

      setUser(userData);

      toast({
        title: 'Registration successful',
        description: `Welcome ${userData.firstName}`,
      });

      return true;
    } catch (err: any) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.detail || 'Unable to register',
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
