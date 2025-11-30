import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { AdmissionFilters } from '@/components/admission/AdmissionFilters';
import { AdmissionTable } from '@/components/admission/AdmissionTable';
import { AdmitPatientModal } from '@/components/admission/AdmitPatientModal';
import type { Admission } from '@/types/admission';

const AdmissionPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    ward: '',
    status: '',
    doctor: '',
  });
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  
  // Mock Data
  const [admissions, setAdmissions] = useState<Admission[]>([
    {
      id: 'ADM-2023-001',
      patientId: 'P-1001',
      patientName: 'Juan Dela Cruz',
      admissionDate: '2023-10-25T08:00:00',
      attendingPhysician: 'Dr. Smith',
      ward: 'General Ward',
      room: '101',
      bed: 'A',
      status: 'Active',
      encounterType: 'Inpatient',
      admittingDiagnosis: 'J18.9 - Pneumonia, unspecified',
      reasonForAdmission: 'High fever and difficulty breathing',
      admissionCategory: 'Emergency',
      modeOfArrival: 'Walk-in'
    },
    {
      id: 'ADM-2023-002',
      patientId: 'P-1002',
      patientName: 'Maria Santos',
      admissionDate: '2023-10-26T10:30:00',
      attendingPhysician: 'Dr. Johnson',
      ward: 'ICU',
      room: '201',
      bed: '1',
      status: 'Active',
      encounterType: 'Inpatient',
      admittingDiagnosis: 'I21.9 - Acute myocardial infarction',
      reasonForAdmission: 'Chest pain',
      admissionCategory: 'Emergency',
      modeOfArrival: 'Ambulance'
    }
  ]);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({ ward: '', status: '', doctor: '' });
  };

  const handleAdmitPatient = (data: any) => {
    const newAdmission: Admission = {
      id: `ADM-${new Date().getFullYear()}-${String(admissions.length + 1).padStart(3, '0')}`,
      patientId: data.patientId || 'P-NEW',
      patientName: data.patientName,
      admissionDate: data.admissionDate,
      attendingPhysician: data.attendingPhysician,
      ward: data.ward,
      room: data.room,
      bed: data.bed,
      status: 'Active',
      encounterType: 'Inpatient',
      admittingDiagnosis: data.admittingDiagnosis,
      reasonForAdmission: data.reasonForAdmission,
      admissionCategory: data.admissionCategory,
      modeOfArrival: data.modeOfArrival
    };
    setAdmissions([...admissions, newAdmission]);
  };

  const filteredAdmissions = admissions.filter(admission => {
    const matchesSearch = admission.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          admission.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWard = !activeFilters.ward || admission.ward === activeFilters.ward;
    const matchesStatus = !activeFilters.status || admission.status === activeFilters.status;
    const matchesDoctor = !activeFilters.doctor || admission.attendingPhysician === activeFilters.doctor;

    return matchesSearch && matchesWard && matchesStatus && matchesDoctor;
  });

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admission Management</h1>
          <p className="text-gray-600">Manage inpatient encounters and room assignments</p>
        </div>
        <Button onClick={() => setIsAdmitModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Admit Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="mb-2 md:mb-0">Admitted Patients</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <AdmissionFilters
                activeFilters={activeFilters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdmissionTable admissions={filteredAdmissions} />
        </CardContent>
      </Card>

      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onAdmit={handleAdmitPatient}
      />
    </div>
  );
};

export default AdmissionPage;
