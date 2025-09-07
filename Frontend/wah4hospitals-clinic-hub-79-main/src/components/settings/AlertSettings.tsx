
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Phone } from 'lucide-react';

const AlertSettings = () => {
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alert Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
            </div>
          </div>
          <Switch 
            checked={smsAlerts}
            onCheckedChange={setSmsAlerts}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <div>
              <p className="font-medium">Email Alerts</p>
              <p className="text-sm text-muted-foreground">Receive alerts via email</p>
            </div>
          </div>
          <Switch 
            checked={emailAlerts}
            onCheckedChange={setEmailAlerts}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertSettings;
