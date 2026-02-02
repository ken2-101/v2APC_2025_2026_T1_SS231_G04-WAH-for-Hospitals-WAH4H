import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';

// Import Dashboard Components
import DashboardHeader from '@/components/dashboards/DashboardHeader';
import DoctorDashboard from '@/components/dashboards/DoctorDashboard';
import NurseDashboard from '@/components/dashboards/NurseDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import PharmacistDashboard from '@/components/dashboards/PharmacistDashboard';
import LabDashboard from '@/components/dashboards/LabDashboard';
import BillingDashboard from '@/components/dashboards/BillingDashboard';

// Widget Configuration Types
export type DashboardWidget = 'metrics' | 'admissions' | 'department_load' | 'patients' | 'appointments' | 'alerts';

export const WIDGET_LABELS: Record<DashboardWidget, string> = {
  metrics: 'Key Performance Metrics',
  admissions: 'Trends & Charts',
  department_load: 'Department Activity',
  patients: 'Patient Lists',
  appointments: 'Tasks & Actions', // Renamed for clarity in role-based context
  alerts: 'System Alerts'
};

const ModernDashboard = () => {
  const { user } = useAuth();
  const { currentRole } = useRole();

  // State for dashboard customization
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`dashboard_config_${user?.id}`);
    return saved ? JSON.parse(saved) : {
      metrics: true,
      admissions: true,
      department_load: true,
      patients: true,
      appointments: true,
      alerts: true
    };
  });

  // Save config when changed
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`dashboard_config_${user.id}`, JSON.stringify(visibleWidgets));
    }
  }, [visibleWidgets, user?.id]);

  const toggleWidget = (widget: string) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widget]: !prev[widget]
    }));
  };

  const renderRoleBasedContent = () => {
    switch (currentRole) {
      case 'doctor':
        return <DoctorDashboard visibleWidgets={visibleWidgets} />;
      case 'nurse':
        return <NurseDashboard visibleWidgets={visibleWidgets} />;
      case 'admin':
        return <AdminDashboard visibleWidgets={visibleWidgets} />;
      case 'pharmacist':
        return <PharmacistDashboard visibleWidgets={visibleWidgets} />;
      case 'lab_technician':
        return <LabDashboard visibleWidgets={visibleWidgets} />;
      case 'billing_clerk':
        return <BillingDashboard visibleWidgets={visibleWidgets} />;
      default:
        // Fallback for unhandled roles (treat as Doctor/Standard for now or show error)
        return <DoctorDashboard visibleWidgets={visibleWidgets} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Shared Header (contains Greeting, Date, and Customization Toggle) */}
      <DashboardHeader 
        onToggleWidget={toggleWidget} 
        visibleWidgets={visibleWidgets} 
        widgetLabels={WIDGET_LABELS} 
      />

      {/* Role-Specific Dashboard Content */}
      {renderRoleBasedContent()}
    </div>
  );
};

export default ModernDashboard;
