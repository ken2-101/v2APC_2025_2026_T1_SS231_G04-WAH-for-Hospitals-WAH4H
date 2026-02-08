import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from './RoleContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface RegisterData {
  // Personal Identity
  firstName: string;
  middleName?: string;
  lastName: string;
  suffixName?: string;
  mobile: string;
  email: string;
  gender: string;
  birthDate: string;
  language?: string;
  photoUrl?: string;
  role: UserRole | string;
  password: string;
  confirmPassword: string;

  // Address Information
  addressLine?: string;
  addressCity?: string;
  addressDistrict?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;

  // Professional Qualifications
  identifier: string; // PRC License
  qualificationCode?: string;
  qualificationIdentifier?: string;
  qualificationIssuer?: string;
  qualificationPeriodStart?: string;
  qualificationPeriodEnd?: string;
  organization?: string;
  roleCode?: string;
  specialtyCode?: string;
}

type AuthResult = {
  ok: boolean;
  error?: any;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  registerInitiate: (data: RegisterData) => Promise<AuthResult>;
  registerVerify: (email: string, otp: string) => Promise<AuthResult>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
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

  // Create axios instance with base configuration
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const getErrorData = (err: any) => err?.response?.data || { message: 'Request failed.' };

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
      const originalRequest: any = error.config;

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
  const login = async (email: string, password: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/accounts/login/', {
        email,
        password,
      });

      const { tokens, user: rawUser } = res.data;

      // Store authentication tokens
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);

      // Map backend user data to frontend User interface
      const userObj: User = {
        id: String(rawUser.id),
        email: rawUser.email,
        firstName: rawUser.first_name,
        lastName: rawUser.last_name,
        role: rawUser.role as UserRole,
      };

      setUser(userObj);

      toast({
        title: 'Welcome back!',
        description: `Logged in as ${userObj.firstName} ${userObj.lastName} (${userObj.role})`,
      });

      return { ok: true };
    } catch (err: any) {
      const errorData = getErrorData(err);
      console.error('Login error:', errorData);

      toast({
        title: 'Login failed',
        description: errorData?.message || errorData?.detail || 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      return { ok: false, error: errorData };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register Initiate - Step 1: Validate and cache registration data, send OTP
   */
  const registerInitiate = async (data: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      await axiosInstance.post('/accounts/register/initiate/', {
        identifier: data.identifier,
        first_name: data.firstName,
        middle_name: data.middleName || '',
        last_name: data.lastName,
        suffix_name: data.suffixName || '',
        gender: data.gender,
        birth_date: data.birthDate || null,
        telecom: data.mobile,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        role: data.role,
      });

      toast({
        title: 'OTP Sent',
        description: 'Please check your email for the verification code.',
      });

      return { ok: true };
    } catch (err: any) {
      const errorData = getErrorData(err);
      console.error('Registration initiate error:', errorData);

      toast({
        title: 'Registration failed',
        description: errorData?.message || 'Unable to initiate registration. Please try again.',
        variant: 'destructive',
      });

      return { ok: false, error: errorData };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register Verify - Step 2: Verify OTP and create account with auto-login
   * Returns true on success, false on failure
   */
  const registerVerify = async (email: string, otp: string): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      const res = await axiosInstance.post('/accounts/register/verify/', {
        email,
        otp,
      });

      const { tokens, user: rawUser } = res.data.data;

      // Store authentication tokens
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('refreshToken', tokens.refresh);

      // Map backend user data to frontend User interface
      const userObj: User = {
        id: String(rawUser.id),
        email: rawUser.email,
        firstName: rawUser.first_name,
        lastName: rawUser.last_name,
        role: rawUser.role as UserRole,
      };

      setUser(userObj);

      toast({
        title: 'Welcome!',
        description: `Account created successfully. Welcome, ${userObj.firstName}!`,
      });

      return { ok: true };
    } catch (err: any) {
      const errorData = getErrorData(err);
      console.error('Registration verify error:', errorData);

      toast({
        title: 'Verification failed',
        description: errorData?.message || 'Invalid or expired OTP. Please try again.',
        variant: 'destructive',
      });
      return { ok: false, error: errorData };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user account (Legacy method - kept for backward compatibility)
   * Creates account and provides appropriate user feedback
   */
  const register = async (data: RegisterData): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      await axiosInstance.post('/accounts/register/', {
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

      return { ok: true };
    } catch (err: any) {
      const errorData = getErrorData(err);
      console.error('Registration error:', errorData);

      toast({
        title: 'Registration failed',
        description: errorData?.message || 'Unable to complete registration. Please try again.',
        variant: 'destructive',
      });
      return { ok: false, error: errorData };
    } finally {
      setIsLoading(false);
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
        registerInitiate,
        registerVerify, 
        logout, 
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
