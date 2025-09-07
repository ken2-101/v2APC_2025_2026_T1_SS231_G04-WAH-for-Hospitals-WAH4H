
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from './RoleContext';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get users from localStorage or create demo user
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      let foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      // If no users exist, create a demo user for first login
      if (users.length === 0 && email === 'demo@hospital.com' && password === 'demo123') {
        foundUser = {
          id: '1',
          email: 'demo@hospital.com',
          firstName: 'Demo',
          lastName: 'User',
          password: 'demo123',
          role: 'administrator'
        };
        users.push(foundUser);
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        // Set the user's role in the role context
        localStorage.setItem('userRole', foundUser.role);
        
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${foundUser.firstName} ${foundUser.lastName}`,
        });
        
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Try demo@hospital.com / demo123",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        toast({
          title: "Registration failed",
          description: "Passwords do not match",
          variant: "destructive"
        });
        return false;
      }

      // Validate password strength
      if (userData.password.length < 6) {
        toast({
          title: "Registration failed",
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        });
        return false;
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.find((u: any) => u.email === userData.email)) {
        toast({
          title: "Registration failed",
          description: "An account with this email already exists",
          variant: "destructive"
        });
        return false;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: userData.password,
        role: userData.role
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      toast({
        title: "Registration successful!",
        description: `Account created with ${userData.role} role. Please log in.`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminMode');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
