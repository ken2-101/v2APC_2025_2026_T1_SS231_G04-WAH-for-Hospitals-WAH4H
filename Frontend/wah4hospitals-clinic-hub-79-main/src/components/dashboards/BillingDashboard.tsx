import React from 'react';
import { 
  FileText, 
  DollarSign,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BillingDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ visibleWidgets }) => {
  const tasks = [
    { id: 1, title: 'Pending Insurance Claims', count: 24, urgent: true, icon: <DollarSign className="w-4 h-4" /> },
    { id: 2, title: 'Unpaid Invoices (>30 days)', count: 5, urgent: false, icon: <FileText className="w-4 h-4" /> },
  ];

  const revenueData = [
    { day: 'Mon', revenue: 45000 },
    { day: 'Tue', revenue: 52000 },
    { day: 'Wed', revenue: 48000 },
    { day: 'Thu', revenue: 61000 },
    { day: 'Fri', revenue: 55000 },
    { day: 'Sat', revenue: 38000 },
    { day: 'Sun', revenue: 25000 },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
           <MetricCard
            title="Revenue Today"
            value="₱125,000"
            change={5}
            changeType="increase"
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            title="Pending Claims"
            value="24"
            change={8}
            changeType="increase"
            icon={<FileText className="w-5 h-5" />}
            color="orange"
          />
           <MetricCard
            title="Collection Rate"
            value="92%"
            change={1}
            changeType="decrease"
            icon={<CreditCard className="w-5 h-5" />}
            color="blue"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.admissions && (
           <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="chart-title text-primary">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {visibleWidgets.appointments && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Briefcase className="w-5 h-5 mr-2" />
                Billing Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {tasks.map((task, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-accent/5 transition-all group cursor-pointer">
                        <div className={cn("p-2 rounded-md", task.urgent ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                          {task.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{task.title}</p>
                          <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                            {task.urgent ? 'Action Required' : 'Standard'}
                          </p>
                        </div>
                        <div className={cn(
                          "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                          task.urgent ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {task.count}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-4 h-4" >→</div>
                        </Button>
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

export default BillingDashboard;
