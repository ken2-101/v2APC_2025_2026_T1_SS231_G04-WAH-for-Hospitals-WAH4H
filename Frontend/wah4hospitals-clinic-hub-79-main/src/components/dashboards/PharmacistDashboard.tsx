import React from 'react';
import { 
  FileText, 
  Activity, 
  AlertTriangle,
  Pill,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PharmacistDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const PharmacistDashboard: React.FC<PharmacistDashboardProps> = ({ visibleWidgets }) => {
  const tasks = [
    { id: 1, title: 'Prescription Verification', count: 8, urgent: true, icon: <FileText className="w-4 h-4" /> },
    { id: 2, title: 'Low Stock Alerts', count: 15, urgent: true, icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 3, title: 'Dispensing Queue', count: 12, urgent: false, icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <MetricCard
            title="Prescriptions Pending"
            value="24"
            change={8}
            changeType="increase"
            icon={<FileText className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Dispensing Queue"
            value="12"
            change={2}
            changeType="decrease"
            icon={<Pill className="w-5 h-5" />}
            color="orange"
          />
           <MetricCard
            title="Low Stock Items"
            value="15"
            change={5}
            changeType="increase"
            icon={<Package className="w-5 h-5" />}
            color="red"
          />
        </div>
      )}

      {visibleWidgets.appointments && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Pill className="w-5 h-5 mr-2" />
              Pharmacy Queue
            </CardTitle>
            <CardDescription>Items ready for dispensing or verification</CardDescription>
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
                          {task.urgent ? 'High Priority' : 'Routine'}
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
  );
};

export default PharmacistDashboard;
