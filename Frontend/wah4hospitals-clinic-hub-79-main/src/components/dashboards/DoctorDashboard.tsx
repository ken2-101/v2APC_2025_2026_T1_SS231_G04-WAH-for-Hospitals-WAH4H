import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Activity, 
  Stethoscope, 
  Bed,
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { admissionService } from '@/services/admissionService';

// Props for customization
interface DoctorDashboardProps {
  visibleWidgets: Record<string, boolean>;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ visibleWidgets }) => {
  const [admittedCount, setAdmittedCount] = useState<number>(0);

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const data = await admissionService.getAll();
        // Count patients with status 'in-progress'
        const activeAdmissions = data.filter(a => a.status === 'in-progress').length;
        setAdmittedCount(activeAdmissions);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };
    fetchAdmissions();
  }, []);

  // Mock Data
  const admissionData = [
    { month: 'Jan', admissions: 120, discharges: 115 },
    { month: 'Feb', admissions: 135, discharges: 128 },
    { month: 'Mar', admissions: 148, discharges: 142 },
    { month: 'Apr', admissions: 162, discharges: 158 },
    { month: 'May', admissions: 175, discharges: 168 },
    { month: 'Jun', admissions: 188, discharges: 182 }
  ];

  const myPatients = [
    { id: 'P001', name: 'Juan Dela Cruz', condition: 'Hypertension', room: '201A', status: 'stable' },
    { id: 'P002', name: 'Maria Santos', condition: 'Diabetes', room: '202B', status: 'critical' },
    { id: 'P004', name: 'Ana Garcia', condition: 'Pneumonia', room: '203A', status: 'stable' }
  ];

  const tasks = [
    { id: 1, title: 'Review Lab Results (Blood Chem)', count: 3, urgent: true, icon: <Activity className="w-4 h-4" /> },
    { id: 2, title: 'Discharge Summaries Pending', count: 2, urgent: false, icon: <FileText className="w-4 h-4" /> },
    { id: 3, title: 'New Consultation Requests', count: 5, urgent: true, icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics - tailored for Doctor */}
      {visibleWidgets.metrics && (
        <div className="dashboard-grid">
          <MetricCard
            title="Admitted Patients"
            value={admittedCount.toString()}
            change={2}
            changeType="increase"
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard
            title="Consultations Today"
            value="8"
            change={0}
            changeType="increase"
            icon={<Stethoscope className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard
            title="Pending Lab Reviews"
            value="5"
            change={3}
            changeType="increase"
            icon={<Activity className="w-5 h-5" />}
            color="orange"
          />
          <MetricCard
            title="Ready for Discharge"
            value="2"
            change={1}
            changeType="increase"
            icon={<FileText className="w-5 h-5" />}
            color="green"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Trends Chart */}
        {visibleWidgets.admissions && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="chart-title text-primary">Patient Outcome Trends</CardTitle>
              <CardDescription>Admissions vs Discharges (6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={admissionData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    label={{ value: 'Month', position: 'insideBottom', offset: -10, style: { fill: '#6b7280', fontSize: '14px', fontWeight: 'bold' } }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: 'Patient Count', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: '14px', fontWeight: 'bold', textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Line type="monotone" dataKey="admissions" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="discharges" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Priority Actions */}
        {visibleWidgets.appointments && (
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <FileText className="w-5 h-5 mr-2" />
                Priority Action Items
              </CardTitle>
              <CardDescription>Clinical tasks requiring attention</CardDescription>
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
                          {task.urgent ? 'Urgent Priority' : 'Normal Priority'}
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

      {/* My Patients List */}
      {visibleWidgets.patients && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Stethoscope className="w-5 h-5 mr-2" />
              My Current Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPatients.map((patient) => (
                <div key={patient.id} className="flex items-center p-4 rounded-xl hover:bg-muted/50 transition-colors border border-border/50 hover:border-primary/20 bg-card/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md mr-4 text-white font-bold text-lg">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{patient.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">Room {patient.room} • {patient.condition}</p>
                    <StatusBadge 
                      status={patient.status === 'critical' ? 'error' : patient.status === 'stable' ? 'success' : 'warning'}
                      className="text-xs py-0.5"
                    >
                      {patient.status}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorDashboard;
