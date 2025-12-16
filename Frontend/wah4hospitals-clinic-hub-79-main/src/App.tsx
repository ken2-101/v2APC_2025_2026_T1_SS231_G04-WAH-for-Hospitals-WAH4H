
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ModernLayout from "@/components/layout/ModernLayout";
import ModernDashboard from "@/pages/ModernDashboard";
import { PatientRegistration } from './pages/PatientRegistration';
import PhilHealthClaims from "./pages/PhilHealthClaims";
import Pharmacy from "./pages/Pharmacy";
import Laboratory from "./pages/Laboratory";

import Monitoring from "./pages/Monitoring";
import Discharge from "./pages/Discharge";
import Inventory from "./pages/Inventory";
import Compliance from "./pages/Compliance";
import AdmissionPage from "./pages/Admission";

import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import AccountSettings from "./pages/AccountSettings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Calendar,
  Activity,
  UserX,
  Package,
  Shield,
  BarChart3,
  Building2,
  Settings as SettingsIcon,
  Receipt,
  Bed,
  Pill,
  TestTube
} from 'lucide-react';

const queryClient = new QueryClient();

const tabs = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'patients', name: 'Patients', icon: <UserPlus className="w-4 h-4" /> },
  { id: 'admission', name: 'Admission', icon: <Bed className="w-4 h-4" /> },
  { id: 'philhealth', name: 'PhilHealth', icon: <FileText className="w-4 h-4" /> },
  { id: 'pharmacy', name: 'Pharmacy', icon: <Pill className="w-4 h-4" /> },
  { id: 'laboratory', name: 'Laboratory', icon: <TestTube className="w-4 h-4" /> },
  { id: 'appointments', name: 'Appointments', icon: <Calendar className="w-4 h-4" /> },
  { id: 'monitoring', name: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
  { id: 'discharge', name: 'Discharge', icon: <UserX className="w-4 h-4" /> },
  { id: 'inventory', name: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'compliance', name: 'Compliance', icon: <Shield className="w-4 h-4" /> },
  { id: 'statistics', name: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'erp', name: 'ERP', icon: <Building2 className="w-4 h-4" /> },
  { id: 'billing', name: 'Billing', icon: <Receipt className="w-4 h-4" /> },
  { id: 'settings', name: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> }
];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const location = useLocation();

  // Sync activeTab with current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') {
      setActiveTab('dashboard');
    } else if (path === '/patients' || path === '/patient-registration') {
      setActiveTab('patients');
    } else if (path === '/admission') {
      setActiveTab('admission');
    } else if (path === '/philhealth' || path === '/philhealth-claims') {
      setActiveTab('philhealth');
    } else if (path === '/pharmacy') {
      setActiveTab('pharmacy');
    } else if (path === '/laboratory') {
      setActiveTab('laboratory');
    } else if (path === '/appointments') {
      setActiveTab('appointments');
    } else if (path === '/monitoring') {
      setActiveTab('monitoring');
    } else if (path === '/discharge') {
      setActiveTab('discharge');
    } else if (path === '/inventory') {
      setActiveTab('inventory');
    } else if (path === '/compliance') {
      setActiveTab('compliance');
    } else if (path === '/statistics') {
      setActiveTab('statistics');
    } else if (path === '/erp') {
      setActiveTab('erp');
    } else if (path === '/billing') {
      setActiveTab('billing');
    } else if (path === '/settings' || path === '/control-panel') {
      setActiveTab('settings');
    }
  }, [location.pathname]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ModernDashboard />;
      case 'patients':
        return <PatientRegistration />;
      case 'admission':
        return <AdmissionPage onNavigate={(tabId: string) => setActiveTab(tabId)} />;
      case 'philhealth':
        return <PhilHealthClaims />;
      case 'pharmacy':
        return <Pharmacy />;
      case 'laboratory':
        return <Laboratory />;
      case 'appointments':
        return <div className="p-6">Appointments Module (Coming Soon)</div>;
      case 'monitoring':
        return <Monitoring />;
      case 'discharge':
        return <Discharge />;
      case 'inventory':
        return <Inventory />;
      case 'compliance':
        return <Compliance />;
      case 'statistics':
        return <div className="p-6">Statistics Module (Coming Soon)</div>;
      case 'erp':
        return <div className="p-6">ERP Module (Coming Soon)</div>;
      case 'billing':
        return <Billing />;
      case 'settings':
        return <Settings />;
      default:
        return <ModernDashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <ModernLayout
        activeTab={activeTab}
        tabs={tabs}
        onTabChange={setActiveTab}
      >
        {renderContent()}
      </ModernLayout>
    </ProtectedRoute>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RoleProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<AppContent />} />
              <Route path="/dashboard" element={<AppContent />} />
              <Route path="/patients" element={<AppContent />} />
              <Route path="/patient-registration" element={<AppContent />} />
              <Route path="/admission" element={<AppContent />} />
              <Route path="/philhealth" element={<AppContent />} />
              <Route path="/philhealth-claims" element={<AppContent />} />
              <Route path="/pharmacy" element={<AppContent />} />
              <Route path="/laboratory" element={<AppContent />} />
              <Route path="/appointments" element={<AppContent />} />
              <Route path="/monitoring" element={<AppContent />} />
              <Route path="/discharge" element={<AppContent />} />
              <Route path="/inventory" element={<AppContent />} />
              <Route path="/compliance" element={<AppContent />} />
              <Route path="/statistics" element={<AppContent />} />
              <Route path="/erp" element={<AppContent />} />
              <Route path="/billing" element={<AppContent />} />
              <Route path="/settings" element={<AppContent />} />
              <Route path="/control-panel" element={<AppContent />} />
              <Route path="/account-settings" element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
