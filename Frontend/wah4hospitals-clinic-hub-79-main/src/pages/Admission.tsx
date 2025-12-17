// src/pages/admission/Admission.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { AdmissionFilters } from '@/components/admission/AdmissionFilters';
import { AdmissionTable } from '@/components/admission/AdmissionTable';
import { AdmitPatientModal } from '@/components/admission/AdmitPatientModal';
import type { Admission, NewAdmission } from '@/types/admission';
import { admissionService } from '@/services/admissionService';

interface AdmissionProps {
  onNavigate?: (tabId: string) => void;
}

const Admission: React.FC<AdmissionProps> = ({ onNavigate }) => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({ ward: '', status: '', doctor: '' });
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);

  // Fetch admissions
  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const data = await admissionService.getAll();
      setAdmissions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching admissions:', err);
      setError('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  // Filter handlers
  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({ ward: '', status: '', doctor: '' });
  };

  // Admit patient handler
  const handleAdmitPatient = async (data: any) => {
    try {
      const payload: NewAdmission = {
        patient: data.patientId,
        admission_date: data.admissionDate,
        attending_physician: data.attendingPhysician,
        ward: data.ward,
        room: data.room,
        bed: data.bed,
        status: 'Active', // type-safe literal
        encounter_type: 'Inpatient', // type-safe literal
        admitting_diagnosis: data.admittingDiagnosis,
        reason_for_admission: data.reasonForAdmission,
        admission_category: data.admissionCategory as 'Emergency' | 'Regular',
        mode_of_arrival: data.modeOfArrival as 'Walk-in' | 'Ambulance' | 'Referral',
      };

      await admissionService.create(payload);
      await fetchAdmissions();
      setIsAdmitModalOpen(false);
    } catch (err) {
      console.error('Error admitting patient:', err);
    }
  };

  // Filtered admissions
  const filteredAdmissions = admissions.filter(admission => {
    const patientName = admission.patient_details
      ? `${admission.patient_details.last_name}, ${admission.patient_details.first_name}`.toLowerCase()
      : '';

    const matchesSearch =
      patientName.includes(searchTerm.toLowerCase()) ||
      admission.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWard = !activeFilters.ward || admission.ward === activeFilters.ward;
    const matchesStatus = !activeFilters.status || admission.status === activeFilters.status;
    const matchesDoctor = !activeFilters.doctor || admission.attending_physician === activeFilters.doctor;

    return matchesSearch && matchesWard && matchesStatus && matchesDoctor;
  });

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  if (loading) return <div>Loading admissions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admission Management</h1>
          <p className="text-gray-600">Manage inpatient encounters and room assignments</p>
        </div>
        <Button
          onClick={() => setIsAdmitModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Admit Patient
        </Button>
      </div>

      {/* Admission Card */}
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
                  onChange={e => setSearchTerm(e.target.value)}
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

      {/* Admit Patient Modal */}
      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onAdmit={handleAdmitPatient}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default Admission;
