
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type UserRole = 'doctor' | 'nurse' | 'pharmacist' | 'lab-technician' | 'administrator' | 'radiologist' | 'billing-staff';

export interface RoleContextType {
  isAdminMode: boolean;
  currentRole: UserRole;
  availableTabs: string[];
  setAdminMode: (enabled: boolean) => void;
  setCurrentRole: (role: UserRole) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Role access configuration - strict role-based access
const roleAccessConfig: Record<UserRole, string[]> = {
  'doctor': ['dashboard', 'patients', 'admission', 'monitoring', 'discharge', 'philhealth', 'settings'],
  'nurse': ['dashboard', 'patients', 'admission', 'monitoring', 'appointments', 'settings'],
  'pharmacist': ['dashboard', 'pharmacy', 'settings'],
  'lab-technician': ['dashboard', 'monitoring', 'settings'],
  'administrator': ['dashboard', 'patients', 'admission', 'philhealth', 'pharmacy', 'appointments', 'monitoring', 'discharge', 'billing', 'settings'],
  'radiologist': ['dashboard', 'monitoring', 'patients', 'settings'],
  'billing-staff': ['dashboard', 'philhealth', 'erp', 'billing', 'settings']
};

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('adminMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    // Get role from authenticated user or fallback to localStorage
    if (user?.role) {
      return user.role;
    }
    const saved = localStorage.getItem('userRole');
    return (saved as UserRole) || 'doctor';
  });

  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  // Update role when user changes
  useEffect(() => {
    if (user?.role) {
      setCurrentRoleState(user.role);
      localStorage.setItem('userRole', user.role);
    }
  }, [user]);

  // Update available tabs when role or admin mode changes
  useEffect(() => {
    if (isAdminMode && currentRole === 'administrator') {
      // Only administrators can enable admin mode for full access
      setAvailableTabs(['dashboard', 'patients', 'admission', 'philhealth', 'pharmacy', 'appointments', 'monitoring', 'discharge', 'inventory', 'compliance', 'statistics', 'erp', 'billing', 'settings']);
    } else {
      // Always use role-based access
      setAvailableTabs(roleAccessConfig[currentRole] || []);
    }
  }, [isAdminMode, currentRole]);

  const setAdminMode = (enabled: boolean) => {
    // Only administrators can enable admin mode
    if (enabled && currentRole !== 'administrator') {
      console.warn('Only administrators can enable admin mode');
      return;
    }

    setIsAdminMode(enabled);
    localStorage.setItem('adminMode', JSON.stringify(enabled));
  };

  const setCurrentRole = (role: UserRole) => {
    // Users cannot change their role - it's determined by their account
    if (user?.role && role !== user.role) {
      console.warn('Cannot change role - role is determined by user account');
      return;
    }

    setCurrentRoleState(role);
    localStorage.setItem('userRole', role);
  };

  return (
    <RoleContext.Provider value={{
      isAdminMode,
      currentRole,
      availableTabs,
      setAdminMode,
      setCurrentRole
    }}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleProvider;
