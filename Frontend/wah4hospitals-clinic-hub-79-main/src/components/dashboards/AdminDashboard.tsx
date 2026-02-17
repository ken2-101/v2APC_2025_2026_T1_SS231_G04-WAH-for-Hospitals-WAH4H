import React from 'react';
import { 
  Users, 
  Activity, 
  Server,
  Database,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ visibleWidgets }) => {
  const trafficData = [
    { time: '00:00', users: 12 },
    { time: '04:00', users: 8 },
    { time: '08:00', users: 45 },
    { time: '12:00', users: 120 },
    { time: '16:00', users: 85 },
    { time: '20:00', users: 32 },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
          <MetricCard
            title="Active Users"
            value="124"
            change={5}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="System Uptime"
            value="99.9%"
            change={0}
            changeType="increase"
            icon={<Server className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            title="Database Load"
            value="34%"
            change={2}
            changeType="decrease"
            icon={<Database className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            title="Security Alerts"
            value="0"
            change={0}
            changeType="increase"
            icon={<ShieldCheck className="w-5 h-5" />}
            color="orange"
          />
        </div>
      )}

      {visibleWidgets.admissions && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
          <CardHeader>
            <CardTitle className="chart-title text-primary">Traffic Overview</CardTitle>
            <CardDescription>System usage over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {visibleWidgets.appointments && (
        <Card className="border-l-4 border-l-yellow-500 shadow-md">
          <CardHeader>
             <CardTitle className="flex items-center text-yellow-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                System Audit Log
             </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                   <div>
                      <p className="font-medium text-yellow-800">Failed Login Attempt</p>
                      <p className="text-sm text-yellow-600">IP: 192.168.1.45 - User: unknown</p>
                   </div>
                   <span className="text-xs font-bold text-yellow-600">Now</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                   <div>
                      <p className="font-medium text-gray-800">Backup Completed</p>
                      <p className="text-sm text-gray-600">Database backup successful (2.3GB)</p>
                   </div>
                   <span className="text-xs font-bold text-gray-600">2h ago</span>
                </div>
             </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
