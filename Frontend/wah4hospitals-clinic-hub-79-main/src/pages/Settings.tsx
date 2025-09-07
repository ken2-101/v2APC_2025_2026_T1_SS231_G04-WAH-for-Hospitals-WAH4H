
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/settings/UserManagement';
import SystemControls from '@/components/settings/SystemControls';
import AuditTrail from '@/components/settings/AuditTrail';
import PasswordSettings from '@/components/settings/PasswordSettings';
import AlertSettings from '@/components/settings/AlertSettings';
import AdminAccess from '@/components/settings/AdminAccess';
import { Users, Settings as SettingsIcon, Clock, Lock, Bell, Crown } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Control Panel</h1>
        <p className="text-gray-600">Manage system settings, users, and monitor activity</p>
      </div>

      <Tabs defaultValue="security" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Admin Access
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-4">
          <PasswordSettings />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertSettings />
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <AdminAccess />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemControls />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditTrail />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
