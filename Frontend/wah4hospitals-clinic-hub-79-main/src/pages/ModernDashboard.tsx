
import React from 'react';
import { 
  Users, 
  Bed, 
  FileText, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  Calendar,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const ModernDashboard = () => {
  const admissionData = [
    { month: 'Jan', admissions: 120, discharges: 115 },
    { month: 'Feb', admissions: 135, discharges: 128 },
    { month: 'Mar', admissions: 148, discharges: 142 },
    { month: 'Apr', admissions: 162, discharges: 158 },
    { month: 'May', admissions: 175, discharges: 168 },
    { month: 'Jun', admissions: 188, discharges: 182 }
  ];

  const currentPatients = [
    { id: 'P001', name: 'Juan Dela Cruz', condition: 'Hypertension', room: '201A', status: 'stable' },
    { id: 'P002', name: 'Maria Santos', condition: 'Diabetes', room: '202B', status: 'critical' },
    { id: 'P003', name: 'Pedro Reyes', condition: 'COVID-19', room: '301C', status: 'recovering' },
    { id: 'P004', name: 'Ana Garcia', condition: 'Pneumonia', room: '203A', status: 'stable' }
  ];

  const upcomingAppointments = [
    { time: '09:00 AM', patient: 'Carlos Mendoza', type: 'Consultation' },
    { time: '10:30 AM', patient: 'Elena Rodriguez', type: 'Follow-up' },
    { time: '02:00 PM', patient: 'Miguel Torres', type: 'Surgery' },
    { time: '03:30 PM', patient: 'Sofia Hernandez', type: 'Lab Review' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good morning, Dr. Santos!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening at your hospital today.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-grid">
        <MetricCard
          title="Total Patients"
          value="184"
          change={12}
          changeType="increase"
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Bed Occupancy"
          value="87%"
          change={5}
          changeType="increase"
          icon={<Bed className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="PhilHealth Claims"
          value="₱2.4M"
          change={8}
          changeType="increase"
          icon={<FileText className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Revenue Today"
          value="₱125K"
          change={3}
          changeType="decrease"
          icon={<DollarSign className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admissions Chart */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="chart-title">Patient Admissions & Discharges</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={admissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="admissions" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="discharges" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="chart-title">Department Patient Load</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { dept: 'Emergency', patients: 45 },
                { dept: 'ICU', patients: 28 },
                { dept: 'Surgery', patients: 32 },
                { dept: 'Pediatrics', patients: 38 },
                { dept: 'Maternity', patients: 22 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dept" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="patients" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="chart-title flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Current Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {patient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.condition} • Room {patient.room}</p>
                    </div>
                  </div>
                  <StatusBadge 
                    status={
                      patient.status === 'critical' ? 'error' :
                      patient.status === 'stable' ? 'success' : 'warning'
                    }
                  >
                    {patient.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="chart-title flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600">{appointment.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{appointment.patient}</p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                  </div>
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card className="card-modern border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="chart-title flex items-center text-yellow-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-yellow-800">Low Medicine Stock</p>
                <p className="text-sm text-yellow-600">Paracetamol inventory is running low (15 units remaining)</p>
              </div>
              <StatusBadge status="warning">Action Required</StatusBadge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">PhilHealth Claim Pending</p>
                <p className="text-sm text-blue-600">3 claims awaiting approval for processing</p>
              </div>
              <StatusBadge status="info">Review</StatusBadge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernDashboard;
