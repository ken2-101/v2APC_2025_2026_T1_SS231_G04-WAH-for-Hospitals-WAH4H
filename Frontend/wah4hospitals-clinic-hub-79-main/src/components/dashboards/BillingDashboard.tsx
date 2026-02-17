import React from 'react';
import { 
  FileText, 
  DollarSign, 
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

interface BillingDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ visibleWidgets }) => {
  const revenueData = [
    { day: 'Mon', amount: 45000 },
    { day: 'Tue', amount: 52000 },
    { day: 'Wed', amount: 48000 },
    { day: 'Thu', amount: 61000 },
    { day: 'Fri', amount: 55000 },
    { day: 'Sat', amount: 32000 },
    { day: 'Sun', amount: 28000 },
  ];

  const pendingClaims = [
      { id: 'CLM-001', patient: 'Juan Dela Cruz', amount: '₱15,000', status: 'pending' },
      { id: 'CLM-002', patient: 'Maria Santos', amount: '₱8,500', status: 'review' },
      { id: 'CLM-003', patient: 'Pedro Reyes', amount: '₱22,000', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
           <MetricCard
            title="Revenue Today"
            value="₱55,000"
            change={8}
            changeType="increase"
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <MetricCard
            title="Pending Claims"
            value="15"
            change={2}
            changeType="increase"
            icon={<FileText className="w-5 h-5" />}
            color="orange"
          />
           <MetricCard
            title="Outstanding Balance"
            value="₱125k"
            change={5}
            changeType="decrease"
            icon={<CreditCard className="w-5 h-5" />}
            color="red"
          />
           <MetricCard
            title="Insured Patients"
            value="85%"
            change={3}
            changeType="increase"
            icon={<Briefcase className="w-5 h-5" />}
            color="blue"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.admissions && (
             <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
             <CardHeader>
               <CardTitle className="chart-title text-primary">Revenue Overview</CardTitle>
               <CardDescription>Daily revenue for the current week</CardDescription>
             </CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={revenueData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                   <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                       border: 'none',
                       borderRadius: '8px',
                       boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                     }} 
                   />
                   <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </CardContent>
           </Card>
        )}

        {visibleWidgets.appointments && (
           <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
           <CardHeader>
             <CardTitle className="flex items-center text-primary">
               <FileText className="w-5 h-5 mr-2" />
               Claims Processing
             </CardTitle>
             <CardDescription>Recent insurance claims and status</CardDescription>
           </CardHeader>
           <CardContent>
              <div className="space-y-4">
                 {pendingClaims.map((claim, index) => (
                     <div key={index} className="flex items-center space-x-4 p-3 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-accent/5 transition-all group cursor-pointer">
                       <div className="p-2 rounded-md bg-green-50 text-green-600">
                         <DollarSign className="w-4 h-4" />
                       </div>
                       <div className="flex-1">
                         <p className="font-medium text-foreground">{claim.id}</p>
                         <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                           {claim.patient} • {claim.amount}
                         </p>
                       </div>
                       <StatusBadge status={claim.status === 'review' ? 'warning' : 'info'} size="sm">
                         {claim.status}
                       </StatusBadge>
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
