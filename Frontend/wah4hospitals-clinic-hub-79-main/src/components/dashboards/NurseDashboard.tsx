import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Activity, 
  Clock,
  HeartPulse,
  Syringe,
  AlertCircle,
  FlaskConical,
  Pill
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { admissionService } from '@/services/admissionService';
import { laboratoryService } from '@/services/laboratoryService';
import pharmacyService from '@/services/pharmacyService';

interface NurseDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const NurseDashboard: React.FC<NurseDashboardProps> = ({ visibleWidgets }) => {
  const [admittedCount, setAdmittedCount] = useState<number>(0);
  const [labCount, setLabCount] = useState<number>(0);
  const [medsCount, setMedsCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Admissions
        const admissions = await admissionService.getAll();
        const activeAdmissions = admissions.filter(a => a.status === 'in-progress').length;
        setAdmittedCount(activeAdmissions);

        // Fetch Lab Requests (Requested + Verified/Pending)
        const labReqs = await laboratoryService.getLabRequests({ status: 'requested' });
        setLabCount(labReqs.count);

        // Fetch Medication Requests (Pending/Active)
        const activeMeds = await pharmacyService.getRequests('active');
        // Fetch Prescribed Requests (Draft)
        const prescribedMeds = await pharmacyService.getRequests('prescribed');
        setMedsCount(activeMeds.length + prescribedMeds.length);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchData();
  }, []);

  // Mock Data
  const shiftActivity = [
    { hour: '6am', checked: 12 },
    { hour: '8am', checked: 45 },
    { hour: '10am', checked: 32 },
    { hour: '12pm', checked: 28 },
    { hour: '2pm', checked: 38 },
    { hour: '4pm', checked: 15 }
  ];

  const tasks = [
    { id: 1, title: 'Vitals Check - Room 204', time: '10:00 AM', urgent: true, icon: <HeartPulse className="w-4 h-4" /> },
    { id: 2, title: 'Administer Meds - Room 301', time: '10:15 AM', urgent: true, icon: <Syringe className="w-4 h-4" /> },
    { id: 3, title: 'Patient Turning - Room 202', time: '11:00 AM', urgent: false, icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
          <MetricCard
            title="Admitted Patients"
            value={admittedCount.toString()}
            change={0}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Lab Requests"
            value={labCount.toString()}
            change={2}
            changeType="increase"
            icon={<FlaskConical className="w-5 h-5" />}
            color="orange"
          />
          <MetricCard
            title="Medication Request"
            value={medsCount.toString()}
            change={1}
            changeType="increase"
            icon={<Pill className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            title="Alerts"
            value="1"
            change={0}
            changeType="increase"
            icon={<AlertCircle className="w-5 h-5" />}
            color="red"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleWidgets.admissions && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="chart-title text-primary">Shift Activity</CardTitle>
              <CardDescription>Patient interactions per hour</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shiftActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="checked" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {visibleWidgets.appointments && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Clock className="w-5 h-5 mr-2" />
                Upcoming Tasks
              </CardTitle>
              <CardDescription>Scheduled nursing duties</CardDescription>
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
                          Due at {task.time}
                        </p>
                      </div>
                      <StatusBadge status={task.urgent ? 'error' : 'info'} size="sm">
                        {task.urgent ? 'Urgent' : 'Routine'}
                      </StatusBadge>
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

export default NurseDashboard;
