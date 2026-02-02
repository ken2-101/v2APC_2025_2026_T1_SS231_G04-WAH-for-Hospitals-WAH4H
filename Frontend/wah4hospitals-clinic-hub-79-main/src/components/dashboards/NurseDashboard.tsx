import React from 'react';
import { 
  Users, 
  FileText, 
  Activity, 
  Stethoscope, 
  Bed,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface NurseDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const NurseDashboard: React.FC<NurseDashboardProps> = ({ visibleWidgets }) => {
  const patientLoad = [
    { hour: '8AM', patients: 12 },
    { hour: '10AM', patients: 15 },
    { hour: '12PM', patients: 14 },
    { hour: '2PM', patients: 16 },
    { hour: '4PM', patients: 12 },
  ];

  const tasks = [
    { id: 1, title: 'Vitals Recording Due', count: 4, urgent: true, icon: <Activity className="w-4 h-4" /> },
    { id: 2, title: 'Medication Administration', count: 2, urgent: true, icon: <Stethoscope className="w-4 h-4" /> },
    { id: 3, title: 'Patient Turning Schedule', count: 3, urgent: false, icon: <Bed className="w-4 h-4" /> },
  ];

  const myWardPatients = [
    { id: 'P001', name: 'Juan Dela Cruz', room: '201A', needs: 'BP Check 2pm', status: 'stable' },
    { id: 'P002', name: 'Maria Santos', room: '202B', needs: 'Insulin 1pm', status: 'critical' },
    { id: 'P005', name: 'Robert Lim', room: '204A', needs: 'Wound Care', status: 'recovering' }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
           <MetricCard
            title="Assigned Patients"
            value="8"
            change={0}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Vitals Due"
            value="4"
            change={2}
            changeType="increase"
            icon={<Activity className="w-5 h-5" />}
            color="orange"
          />
          <MetricCard
            title="Medications Due"
            value="2"
            change={0}
            changeType="decrease"
            icon={<Clock className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            title="Empty Beds"
            value="3"
            change={1}
            changeType="increase"
            icon={<Bed className="w-5 h-5" />}
            color="green"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions */}
        {visibleWidgets.appointments && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <FileText className="w-5 h-5 mr-2" />
                Shift Tasks
              </CardTitle>
              <CardDescription>Nursing care actions required</CardDescription>
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
                          {task.urgent ? 'Due Now' : 'Upcoming'}
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

        {/* Activity Chart */}
        {visibleWidgets.department_load && (
           <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="chart-title text-primary">Hourly Ward Activity</CardTitle>
              <CardDescription>Patient requests and interventions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={patientLoad}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="patients" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

       {/* Ward Patients List */}
       {visibleWidgets.patients && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Bed className="w-5 h-5 mr-2" />
              My Ward Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myWardPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 bg-card/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center font-bold">
                       {patient.room}
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">{patient.name}</p>
                        <p className="text-sm font-medium text-blue-600">{patient.needs}</p>
                    </div>
                  </div>
                  <StatusBadge status={patient.status === 'critical' ? 'error' : patient.status === 'stable' ? 'success' : 'warning'}>
                    {patient.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NurseDashboard;
