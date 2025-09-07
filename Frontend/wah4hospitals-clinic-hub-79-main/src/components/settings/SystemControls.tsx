
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Shield, Database, Server, Wifi } from 'lucide-react';

const SystemControls = () => {
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    twoFactorAuth: true,
    sessionTimeout: true
  });

  const systemStatus = [
    { name: 'Database', status: 'online', icon: Database },
    { name: 'Server', status: 'online', icon: Server },
    { name: 'Network', status: 'online', icon: Wifi },
    { name: 'Security', status: 'secure', icon: Shield }
  ];

  const handleSettingChange = (setting: string, value: boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemStatus.map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.name} className="flex items-center gap-2 p-3 border rounded-lg">
                  <IconComponent className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <Badge variant={item.status === 'online' || item.status === 'secure' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Temporarily disable system access</p>
            </div>
            <Switch 
              checked={systemSettings.maintenanceMode}
              onCheckedChange={(value) => handleSettingChange('maintenanceMode', value)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Auto Backup</p>
              <p className="text-sm text-muted-foreground">Automatic daily system backups</p>
            </div>
            <Switch 
              checked={systemSettings.autoBackup}
              onCheckedChange={(value) => handleSettingChange('autoBackup', value)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
            </div>
            <Switch 
              checked={systemSettings.twoFactorAuth}
              onCheckedChange={(value) => handleSettingChange('twoFactorAuth', value)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Session Timeout</p>
              <p className="text-sm text-muted-foreground">Auto logout after 30 minutes of inactivity</p>
            </div>
            <Switch 
              checked={systemSettings.sessionTimeout}
              onCheckedChange={(value) => handleSettingChange('sessionTimeout', value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Restore Backup
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Last backup: January 15, 2024 at 3:00 AM</p>
            <p>Next scheduled backup: January 16, 2024 at 3:00 AM</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemControls;
