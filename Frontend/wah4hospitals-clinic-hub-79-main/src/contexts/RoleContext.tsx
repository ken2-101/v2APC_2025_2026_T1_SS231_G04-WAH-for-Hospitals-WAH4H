import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type UserRole =
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'lab-technician'
  | 'administrator'
  | 'radiologist'
  | 'billing-staff';

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
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
};

// Role-based access configuration
const roleAccessConfig: Record<UserRole, string[]> = {
  doctor: ['dashboard', 'patients', 'admission', 'laboratory', 'monitoring', 'discharge', 'philhealth', 'settings'],
  nurse: ['dashboard', 'patients', 'admission', 'laboratory', 'monitoring', 'inventory', 'appointments', 'settings'],
  pharmacist: ['dashboard', 'pharmacy', 'inventory', 'compliance', 'settings'],
  'lab-technician': ['dashboard', 'laboratory', 'monitoring', 'compliance', 'settings'],
  administrator: [
    'dashboard', 'patients', 'admission', 'laboratory', 'philhealth', 'pharmacy',
    'appointments', 'monitoring', 'discharge', 'inventory', 'compliance', 'billing', 'settings'
  ],
  radiologist: ['dashboard', 'monitoring', 'patients', 'settings'],
  'billing-staff': ['dashboard', 'philhealth', 'erp', 'billing', 'settings'],
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
    return (user?.role as UserRole) || (localStorage.getItem('userRole') as UserRole) || 'doctor';
  });

  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  // Update role when user changes
  useEffect(() => {
    if (user?.role) {
      setCurrentRoleState(user.role);
      localStorage.setItem('userRole', user.role);
    }
  }, [user]);

  // Update available tabs whenever role or admin mode changes
  useEffect(() => {
    if (isAdminMode && currentRole === 'administrator') {
      setAvailableTabs([
        'dashboard', 'patients', 'admission', 'laboratory', 'philhealth', 'pharmacy',
        'appointments', 'monitoring', 'discharge', 'inventory', 'compliance', 'statistics', 'erp', 'billing', 'settings'
      ]);
    } else {
      setAvailableTabs(roleAccessConfig[currentRole] || []);
    }
  }, [isAdminMode, currentRole]);

  const setAdminMode = (enabled: boolean) => {
    if (enabled && currentRole !== 'administrator') {
      console.warn('Only administrators can enable admin mode');
      return;
    }
    setIsAdminMode(enabled);
    localStorage.setItem('adminMode', JSON.stringify(enabled));
  };

  const setCurrentRole = (role: UserRole) => {
    if (user?.role && role !== user.role) {
      console.warn('Cannot change role - role is determined by user account');
      return;
    }
    setCurrentRoleState(role);
    localStorage.setItem('userRole', role);
  };

  return (
    <RoleContext.Provider
      value={{
        isAdminMode,
        currentRole,
        availableTabs,
        setAdminMode,
        setCurrentRole
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export default RoleProvider;
