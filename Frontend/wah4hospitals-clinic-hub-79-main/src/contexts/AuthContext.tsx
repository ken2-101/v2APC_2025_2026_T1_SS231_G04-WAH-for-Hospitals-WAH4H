import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from './RoleContext';

const API_BASE_URL =
  import.meta.env.STURDY_ADVENTURE_BASE_8000 ||
  import.meta.env.LOCAL_8000 ||
  import.meta.env.STURDY_ADVENTURE_BASE;

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
  isAuthenticated: boolean;
  refreshUserData: () => Promise<void>;
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

  // Initialize user from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        const userData = JSON.parse(saved);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Create axios instance with base configuration
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor: Add auth token to all requests
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Handle token refresh on 401
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 error and we haven't retried yet, attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
              refresh: refreshToken,
            });

            const { access } = response.data;
            localStorage.setItem('accessToken', access);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            // Token refresh failed - logout user
            console.error('Token refresh failed:', refreshError);
            logout();
            return Promise.reject(refreshError);
          }
        }
      }

      return Promise.reject(error);
    }
  );

  /**
   * Login user with email and password
   * Validates credentials and stores authentication tokens
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/accounts/login/', {
        email,
        password,
      });

      const { tokens, user: rawUser } = res.data;

      const userData: User = {
        id: rawUser.id,
        email: rawUser.email,
        firstName: rawUser.first_name,
        lastName: rawUser.last_name,
        role: rawUser.role,
      };

      // Store authentication tokens
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);

      // Map backend user data to frontend User interface
      const userObj: User = {
        id: userData.id.toString(),
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role as UserRole,
      };

      localStorage.setItem('currentUser', JSON.stringify(userObj));
      localStorage.setItem('userRole', userData.role);

      setUser(userObj);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${userData.first_name} ${userData.last_name} (${userData.role})`,
      });

      return true;
    } catch (err: any) {
      console.error('Login error:', err.response?.data);

      toast({
        title: 'Login failed',
        description: err.response?.data?.detail || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user account
   * Creates account and provides appropriate user feedback
   */
  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/accounts/register/', {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role,
      });

      toast({
        title: 'Registration successful',
        description: `Welcome ${data.firstName}! You can now log in with your credentials.`,
      });

      return true;
    } catch (err: any) {
      console.error('Registration error:', err.response?.data);

      // Format error messages for better user experience
      let errorMessage = 'Unable to complete registration. Please try again.';

      if (err.response?.data) {
        const errorData = err.response.data;

        if (typeof errorData === 'object') {
          // Handle field-specific validation errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => {
              const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (Array.isArray(errors)) {
                return `${fieldName}: ${errors.join(', ')}`;
              }
              return `${fieldName}: ${errors}`;
            })
            .join('\n');

          errorMessage = fieldErrors || errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data from server (if needed)
   */
  const refreshUserData = async () => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  /**
   * Logout user and clear all authentication data
   */
  const logout = () => {
    setUser(null);

    // Clear all authentication and session data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminMode');

    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        isLoading,
        isAuthenticated,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
