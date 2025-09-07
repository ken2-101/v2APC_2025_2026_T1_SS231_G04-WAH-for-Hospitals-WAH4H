/*
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Plus, Edit, Eye } from 'lucide-react';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';

const Appointments = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patientName: 'Carlos Mendoza',
      patientId: 'P001',
      doctorName: 'Dr. Maria Santos',
      time: '09:00',
      date: '2024-06-03',
      type: 'Consultation',
      status: 'confirmed',
      reason: 'Regular checkup',
      notes: '',
      contactNumber: '+63 912 345 6789',
      department: 'General Medicine'
    },
    {
      id: 2,
      patientName: 'Elena Rodriguez',
      patientId: 'P002',
      doctorName: 'Dr. Jose Garcia',
      time: '10:30',
      date: '2024-06-03',
      type: 'Follow-up',
      status: 'pending',
      reason: 'Follow-up for medication',
      notes: '',
      contactNumber: '+63 923 456 7890',
      department: 'Cardiology'
    },
    {
      id: 3,
      patientName: 'Miguel Torres',
      patientId: 'P003',
      doctorName: 'Dr. Ana Reyes',
      time: '14:00',
      date: '2024-06-03',
      type: 'Surgery',
      status: 'confirmed',
      reason: 'Scheduled surgery',
      notes: '',
      contactNumber: '+63 934 567 8901',
      department: 'Orthopedics'
    }
  ]);

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setFormMode('add');
    setIsFormOpen(true);
  };

  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setFormMode('view');
    setIsFormOpen(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleSaveAppointment = (data: any) => {
    if (formMode === 'add') {
      const newAppointment = { ...data, id: Date.now() };
      setAppointments(prev => [...prev, newAppointment]);
    } else if (formMode === 'edit') {
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment?.id ? { ...apt, ...data } : apt
      ));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage patient appointments and schedules</p>
        </div>
        <Button onClick={handleAddAppointment} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600">{appointment.time}</p>
                    <p className="text-xs text-gray-500">{appointment.date}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appointment.patientName}</p>
                    <p className="text-sm text-gray-500">{appointment.doctorName} • {appointment.type}</p>
                    <p className="text-xs text-gray-400">{appointment.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(appointment.status)}
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewAppointment(appointment)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AppointmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        data={selectedAppointment}
        onSave={handleSaveAppointment}
      />
    </div>
  );
};

export default Appointments;

*/
