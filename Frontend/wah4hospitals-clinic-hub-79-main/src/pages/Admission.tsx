import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { AdmissionFilters } from '@/components/admission/AdmissionFilters';
import { AdmissionTable } from '@/components/admission/AdmissionTable';
import { AdmitPatientModal } from '@/components/admission/AdmitPatientModal';
import { AdmissionDetailsModal } from '@/components/admission/AdmissionDetailsModal';
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

  // Details modal state
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // -------------------- Fetch admissions --------------------
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

  // -------------------- Filter handlers --------------------
  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({ ward: '', status: '', doctor: '' });
  };

  // -------------------- Admit patient handler --------------------
  // -------------------- Admit patient handler --------------------
  const handleAdmitPatient = async (data: NewAdmission) => {
    try {
      // Data is already formatted as NewAdmission by the modal
      await admissionService.create(data);
      await fetchAdmissions();
      setIsAdmitModalOpen(false);
    } catch (err) {
      console.error('Error admitting patient:', err);
      setError('Failed to admit patient');
    }
  };

  // -------------------- Filtered admissions --------------------
  const filteredAdmissions = admissions.filter(admission => {
    // Access patient name from patient_summary
    const summary = admission.patient_summary;
    const patientName = summary
      ? (summary.full_name || `${summary.last_name}, ${summary.first_name}`).toLowerCase()
      : '';

    const matchesSearch =
      patientName.includes(searchTerm.toLowerCase()) ||
      (admission.identifier && admission.identifier.toLowerCase().includes(searchTerm.toLowerCase()));

    // Note: 'ward' and 'attending_physician' are not top-level fields on Admission interface currently
    // They are inside location_summary and practitioner_summary
    // We'll map them loosely for now to prevent crashes
    const locationName = admission.location_summary?.name || '';
    const doctorName = admission.practitioner_summary?.full_name || admission.practitioner_summary?.name || '';

    const matchesWard = !activeFilters.ward || locationName === activeFilters.ward;
    const matchesStatus = !activeFilters.status || admission.status === activeFilters.status;
    const matchesDoctor = !activeFilters.doctor || doctorName === activeFilters.doctor;

    return matchesSearch && matchesWard && matchesStatus && matchesDoctor;
  });

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

  // -------------------- Open details modal --------------------
  const handleOpenDetails = (admission: Admission) => {
    setSelectedAdmission(admission);
    setIsDetailsModalOpen(true);
  };

  if (loading) return <div>Loading admissions...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  // -------------------- Render --------------------
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
          <AdmissionTable
            admissions={filteredAdmissions}
            onDetailsClick={handleOpenDetails} // wire table to details modal
          />
        </CardContent>
      </Card>

      {/* Admit Patient Modal */}
      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onAdmit={handleAdmitPatient}
        onNavigate={onNavigate}
      />

      {/* Admission Details Modal */}
      <AdmissionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        admission={selectedAdmission}
        onUpdate={async (updatedAdmission) => {
          // update in frontend state
          setAdmissions(prev =>
            prev.map(a => (a.encounter_id === updatedAdmission.encounter_id ? updatedAdmission : a))
          );
        }}
        onDelete={async (id) => {
          setAdmissions(prev => prev.filter(a => a.encounter_id !== id));
        }}
      />
    </div>
  );
};

export default Admission;
