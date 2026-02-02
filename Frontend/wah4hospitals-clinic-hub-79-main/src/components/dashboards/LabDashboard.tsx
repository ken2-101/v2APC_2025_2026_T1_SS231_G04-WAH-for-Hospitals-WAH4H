import React from 'react';
import { 
  FileText, 
  Activity, 
  Settings,
  Microscope,
  TestTube
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LabDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const LabDashboard: React.FC<LabDashboardProps> = ({ visibleWidgets }) => {
  const tasks = [
    { id: 1, title: 'Pending Specimen Analysis', count: 12, urgent: true, icon: <Microscope className="w-4 h-4" /> },
    { id: 2, title: 'Equipment Calibration', count: 1, urgent: true, icon: <Settings className="w-4 h-4" /> },
    { id: 3, title: 'Results Verification', count: 5, urgent: false, icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
           <MetricCard
            title="Tests Queue"
            value="35"
            change={8}
            changeType="increase"
            icon={<TestTube className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Critical Results"
            value="3"
            change={1}
            changeType="increase"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
           <MetricCard
            title="Completed Today"
            value="142"
            change={12}
            changeType="increase"
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
        </div>
      )}

      {visibleWidgets.appointments && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Microscope className="w-5 h-5 mr-2" />
              Laboratory Tasks
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
                          {task.urgent ? 'Expedite' : 'Routine'}
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
import { AlertTriangle } from 'lucide-react';

export default LabDashboard;
