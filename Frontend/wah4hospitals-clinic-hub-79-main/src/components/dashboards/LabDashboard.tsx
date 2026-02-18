import React from 'react';
import { 
  FileText, 
  Activity, 
  FlaskConical,
  Microscope,
  AlertOctagon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

interface LabDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const LabDashboard: React.FC<LabDashboardProps> = ({ visibleWidgets }) => {
  const pendingTests = [
    { id: 1, type: 'Complete Blood Count', patient: 'Juan Dela Cruz', priority: 'urgent', status: 'pending' },
    { id: 2, type: 'Urinalysis', patient: 'Maria Santos', priority: 'normal', status: 'processing' },
    { id: 3, type: 'Lipid Profile', patient: 'Pedro Reyes', priority: 'normal', status: 'pending' },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
           <MetricCard
            title="Pending Tests"
            value="42"
            change={12}
            changeType="increase"
            icon={<FlaskConical className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Results Ready"
            value="18"
            change={5}
            changeType="increase"
            icon={<FileText className="w-5 h-5" />}
            color="green"
          />
           <MetricCard
            title="Critical Values"
            value="3"
            change={1}
            changeType="increase"
            icon={<AlertOctagon className="w-5 h-5" />}
            color="red"
          />
           <MetricCard
            title="Equipment Status"
            value="98%"
            change={0}
            changeType="increase"
            icon={<Microscope className="w-5 h-5" />}
            color="purple"
          />
        </div>
      )}

      {visibleWidgets.appointments && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <FlaskConical className="w-5 h-5 mr-2" />
              Laboratory Queue
            </CardTitle>
            <CardDescription>Specimens processing and pending analysis</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {pendingTests.map((test, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 border border-border/40 rounded-lg hover:border-primary/30 hover:bg-accent/5 transition-all group cursor-pointer">
                      <div className={cn("p-2 rounded-md", test.priority === 'urgent' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{test.type}</p>
                        <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                          Patient: {test.patient}
                        </p>
                      </div>
                      <StatusBadge status={test.status === 'processing' ? 'info' : 'pending'} size="sm">
                        {test.status}
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
  );
};

export default LabDashboard;
