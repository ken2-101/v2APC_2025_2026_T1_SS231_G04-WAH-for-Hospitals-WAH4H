import React from 'react';
import { 
  Users, 
  FileText, 
  Activity, 
  Settings, 
  Shield,
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ visibleWidgets }) => {
  const systemTraffic = [
    { time: '00:00', users: 5 },
    { time: '04:00', users: 12 },
    { time: '08:00', users: 45 },
    { time: '12:00', users: 80 },
    { time: '16:00', users: 65 },
    { time: '20:00', users: 20 },
  ];

  const tasks = [
    { id: 1, title: 'User Access Requests', count: 2, urgent: false, icon: <Users className="w-4 h-4" /> },
    { id: 2, title: 'System Audit Review', count: 1, urgent: false, icon: <FileText className="w-4 h-4" /> },
    { id: 3, title: 'Backup Verification', count: 0, urgent: true, icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
           <MetricCard
            title="Total Users"
            value="124"
            change={5}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="System Health"
            value="99.9%"
            change={0}
            changeType="increase"
            icon={<Server className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            title="Audit Logs Today"
            value="1,240"
            change={15}
            changeType="increase"
            icon={<Shield className="w-5 h-5" />}
            color="purple"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Traffic */}
        {visibleWidgets.metrics && (
           <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="chart-title text-primary">System Traffic</CardTitle>
              <CardDescription>Active users over 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={systemTraffic}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Admin Tasks */}
        {visibleWidgets.appointments && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Settings className="w-5 h-5 mr-2" />
                Administrative Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-accent/5 transition-all cursor-pointer">
                      <div className="bg-slate-100 text-slate-600 p-2 rounded-md">
                        {task.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{task.title}</p>
                      </div>
                      <Button variant="outline" size="sm">Review</Button>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
