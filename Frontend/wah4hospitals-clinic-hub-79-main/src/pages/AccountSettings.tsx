
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Mail, Bell, Shield } from 'lucide-react';
import { Notification } from '@/components/ui/notification';

const AccountSettings = () => {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSaveProfile = () => {
    setNotification({
      message: 'Profile updated successfully',
      type: 'success'
    });
  };

  const handleChangePassword = () => {
    setNotification({
      message: 'Password changed successfully',
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your personal account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" defaultValue="Dr. Maria Santos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue="maria.santos@hospital.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue="+63 912 345 6789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" defaultValue="Cardiology" />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPass">Current Password</Label>
              <Input id="currentPass" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPass">New Password</Label>
              <Input id="newPass" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPass">Confirm New Password</Label>
              <Input id="confirmPass" type="password" />
            </div>
            <Button onClick={handleChangePassword} className="w-full">
              Change Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>In-App Notifications</Label>
                <p className="text-sm text-gray-500">Receive alerts within the system</p>
              </div>
              <Switch 
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Updates</Label>
                <p className="text-sm text-gray-500">Receive summary emails</p>
              </div>
              <Switch 
                checked={emailUpdates}
                onCheckedChange={setEmailUpdates}
              />
            </div>
            
            <Button onClick={() => {
              setNotification({
                message: "Notification preferences updated",
                type: "success"
              });
            }} className="w-full">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Session Management</p>
                <p className="text-sm text-gray-500">Manage active sessions</p>
              </div>
              <Button variant="outline" size="sm">View Sessions</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Account Activity</p>
                <p className="text-sm text-gray-500">View recent account activity</p>
              </div>
              <Button variant="outline" size="sm">View Log</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
