import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { AdmissionFilters } from '@/components/admission/AdmissionFilters';
import { AdmissionTable } from '@/components/admission/AdmissionTable';
import { AdmitPatientModal } from '@/components/admission/AdmitPatientModal';
import type { Admission } from '@/types/admission';

interface AdmissionPageProps {
  onNavigate?: (tabId: string) => void;
}

const AdmissionPage: React.FC<AdmissionPageProps> = ({ onNavigate }) => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    ward: '',
    status: '',
    doctor: '',
  });
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);

  // Fetch admissions from backend
  const fetchAdmissions = async () => {
    try {
      const response = await axios.get<Admission[]>('http://localhost:8000/api/admissions/');
      setAdmissions(response.data);
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

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({ ward: '', status: '', doctor: '' });
  };

  const handleAdmitPatient = async (data: any) => {
    try {
      // Transform form data to match backend expected format
      const payload = {
        id: `ADM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, // Generate ID or let backend handle it if auto-increment
        patient: data.patientId, // Assuming form provides patient ID
        admission_date: data.admissionDate,
        attending_physician: data.attendingPhysician,
        ward: data.ward,
        room: data.room,
        bed: data.bed,
        status: 'Active',
        encounter_type: 'Inpatient',
        admitting_diagnosis: data.admittingDiagnosis,
        reason_for_admission: data.reasonForAdmission,
        admission_category: data.admissionCategory,
        mode_of_arrival: data.modeOfArrival
      };

      await axios.post('http://localhost:8000/api/admissions/', payload);
      
      // Refresh list
      fetchAdmissions();
      setIsAdmitModalOpen(false);
    } catch (err) {
      console.error('Error admitting patient:', err);
      // Handle error (show toast, etc.)
    }
  };

  const filteredAdmissions = admissions.filter(admission => {
    const patientName = admission.patient_details 
      ? `${admission.patient_details.last_name}, ${admission.patient_details.first_name}`.toLowerCase()
      : '';
    
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
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
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default AdmissionPage;
