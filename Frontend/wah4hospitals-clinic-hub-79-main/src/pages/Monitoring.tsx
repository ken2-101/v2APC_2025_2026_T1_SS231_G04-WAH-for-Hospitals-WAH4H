import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Heart, Thermometer, Droplet, Plus, Edit, Eye } from 'lucide-react';
import { PatientMonitoringForm } from '@/components/monitoring/PatientMonitoringForm';

const Monitoring = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'view' | 'edit' | 'add'>('add');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [monitoringData, setMonitoringData] = useState([
    {
      id: '1',
      patientName: 'Juan Dela Cruz',
      room: '201A',
      heartRate: '75',
      bloodPressure: '130/85',
      temperature: '36.8',
      oxygenSat: '98',
      lastUpdated: '10:30 AM',
      // Full monitoring data for view/edit
      patientId: 'P001',
      dateTime: '2024-06-11T10:30',
      patientIdentification: {
        id: 'P001',
        name: 'Juan Dela Cruz',
        age: '45',
        gender: 'Male'
      },
      vitalSigns: {
        heartRate: '75',
        bloodPressure: '130/85',
        temperature: '36.8',
        respiratoryRate: '18'
      },
      painScore: '3',
      intakeOutput: {
        intake: '1200',
        output: '800'
      },
      levelOfConsciousness: 'alert',
      oxygenSaturation: '98',
      respiratoryPattern: 'Regular',
      ivLineStatus: {
        status: 'patent',
        siteCondition: 'Good'
      },
      medicationIntake: 'Paracetamol 500mg taken at 8:00 AM',
      dietaryIntake: 'Full breakfast consumed',
      nursingNotes: 'Patient is stable and cooperative. Vital signs within normal limits.',
      staffSignature: 'Nurse Maria Santos'
    }
  ]);

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setFormMode('add');
    setIsFormOpen(true);
  };

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
    setFormMode('view');
    setIsFormOpen(true);
  };

  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  const handleSaveMonitoring = (data: any) => {
    if (formMode === 'add') {
      const newPatient = {
        ...data,
        id: Date.now().toString(),
        // Sync quick view values with detailed data
        heartRate: data.vitalSigns.heartRate,
        bloodPressure: data.vitalSigns.bloodPressure,
        temperature: data.vitalSigns.temperature,
        oxygenSat: data.oxygenSaturation,
        lastUpdated: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      setMonitoringData(prev => [...prev, newPatient]);
    } else if (formMode === 'edit') {
      setMonitoringData(prev => prev.map(item => {
        if (item.id === selectedPatient?.id) {
          return {
            ...item,
            ...data,
            // Sync quick view values with detailed data
            heartRate: data.vitalSigns.heartRate,
            bloodPressure: data.vitalSigns.bloodPressure,
            temperature: data.vitalSigns.temperature,
            oxygenSat: data.oxygenSaturation,
            lastUpdated: new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          };
        }
        return item;
      }));
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Monitoring</h1>
          <p className="text-gray-600">Monitor patient vital signs and health metrics</p>
        </div>
        <Button onClick={handleAddPatient} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Patient to Monitoring
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Heart Rate</p>
                <p className="text-2xl font-bold text-gray-900">72 BPM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Blood Pressure</p>
                <p className="text-2xl font-bold text-gray-900">120/80</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Thermometer className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-2xl font-bold text-gray-900">36.5°C</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Oxygen Sat</p>
                <p className="text-2xl font-bold text-gray-900">98%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 overflow-x-auto sm:overflow-visible">
            {monitoringData.map((patient) => (
              <div 
                key={patient.id}
                className="flex items-center justify-between p-4 border rounded-lg
                  hover:bg-gray-50 min-w-[600px] sm:win-w-0">
                <div>
                  <p className="font-medium">{patient.patientName} - Room {patient.room}</p>
                  <p className="text-sm text-gray-500">Last updated: {patient.lastUpdated}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-4 text-sm">
                    <span>HR: {patient.heartRate}</span>
                    <span>BP: {patient.bloodPressure}</span>
                    <span>Temp: {patient.temperature}°C</span>
                    <span>O2: {patient.oxygenSat}%</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewPatient(patient)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditPatient(patient)}
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

      <PatientMonitoringForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={formMode}
        data={selectedPatient}
        onSave={handleSaveMonitoring}
      />
    </div>
  );
};

export default Monitoring;
