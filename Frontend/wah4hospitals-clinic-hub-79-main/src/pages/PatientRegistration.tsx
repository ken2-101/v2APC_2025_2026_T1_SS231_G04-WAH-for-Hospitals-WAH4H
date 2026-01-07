// PatientRegistration.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { EditPatientModal } from '@/components/patients/EditPatientModal';
import { DeletePatientModal } from '@/components/patients/DeletePatientModal';
import type { Patient, PatientFormData } from '../types/patient';
import axios from 'axios';

const API_URL =
  import.meta.env.BACKEND_PATIENTS_8000 ||
    import.meta.env.LOCAL_8000
    ? `${import.meta.env.LOCAL_8000}/api/patients/`
    : import.meta.env.BACKEND_PATIENTS;

export const PatientRegistration: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);

  const initialFormData: Omit<PatientFormData, 'patient_id'> = {
    philhealth_id: '',
    national_id: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    sex: 'M',
    date_of_birth: '',
    civil_status: '',
    nationality: '',
    mobile_number: '',
    telephone: '',
    email: '',
    region: '',
    province: '',
    city_municipality: '',
    barangay: '',
    house_no_street: '',
    status: 'Active',
    occupation: '',
  };

  const [formData, setFormData] = useState({ ...initialFormData });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    gender: [] as string[],
    department: [] as string[],
    civilStatus: [] as string[],
  });

  // Fetch patients
  useEffect(() => { fetchPatients(); }, []);
  const fetchPatients = async () => {
    try {
      const res = await axios.get<Patient[]>(API_URL);
      setPatients(Array.isArray(res.data) ? res.data : []);
      setFilteredPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setPatients([]);
      setFilteredPatients([]);
    }
  };

  // Filter & search
  useEffect(() => {
    let temp = [...patients];
    if (activeFilters.status.length) temp = temp.filter(p => activeFilters.status.includes(p.status));
    if (activeFilters.gender.length) temp = temp.filter(p => activeFilters.gender.includes(p.sex));
    if (activeFilters.civilStatus.length) temp = temp.filter(p => activeFilters.civilStatus.includes(p.civil_status));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(
        p => `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase().includes(q) ||
          p.patient_id.toLowerCase().includes(q) ||
          p.mobile_number.includes(searchQuery)
      );
    }
    setFilteredPatients(temp);
  }, [patients, activeFilters, searchQuery]);

  // Form handlers
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterPatient = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setFormError(''); setFormSuccess('');
    try {
      const res = await axios.post(API_URL, formData);
      const registeredPatient: Patient = res.data;
      setFormSuccess(`Patient registered successfully! ID: ${registeredPatient.patient_id}`);
      setShowRegistrationModal(false);
      setFormData({ ...initialFormData });
      fetchPatients();
    } catch (err: any) {
      console.error('Full Axios error:', err);
      if (err.response) {
        const messages = typeof err.response.data === 'object'
          ? Object.entries(err.response.data).map(([f, m]) => Array.isArray(m) ? `${f}: ${m.join(', ')}` : `${f}: ${m}`).join('\n')
          : err.response.data;
        setFormError(messages);
      } else { setFormError(err.message || 'Failed to register patient'); }
    } finally { setFormLoading(false); }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => {
      const prevValues = prev[filterType as keyof typeof prev];
      return {
        ...prev,
        [filterType]: prevValues.includes(value) ? prevValues.filter(v => v !== value) : [...prevValues, value],
      };
    });
  };

  const clearFilters = () => setActiveFilters({ status: [], gender: [], department: [], civilStatus: [] });
  const handleViewDetails = (patient: Patient) => { setSelectedPatient(patient); setShowDetailsModal(true); };

  // --------------------------
  // Edit/Delete handlers
  // --------------------------
  const handleEditPatient = (patient: Patient) => setEditPatient(patient);
  const handleDeletePatient = (patient: Patient) => setDeletePatient(patient);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Patients</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between mb-4 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 max-w-sm"
              />
            </div>
            <Button onClick={() => setShowRegistrationModal(true)} className="flex items-center gap-2">
              <UserPlus /> Register Patient
            </Button>
          </div>

          <PatientFilters
            activeFilters={activeFilters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            hasActiveFilters={Object.values(activeFilters).flat().length > 0}
          />

          <PatientTable
            patients={filteredPatients}
            handleViewDetails={handleViewDetails}
            handleEdit={handleEditPatient}
            handleDelete={handleDeletePatient}
          />
        </CardContent>
      </Card>

      <PatientRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        formData={formData}
        handleFormChange={handleFormChange}
        handleRegisterPatient={handleRegisterPatient}
        formLoading={formLoading}
        success={formSuccess}
        formError={formError}
      />

      {selectedPatient && (
        <PatientDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          patient={selectedPatient}
        />
      )}

      {editPatient && (
        <EditPatientModal
          patient={editPatient}
          isOpen={!!editPatient}
          onClose={() => setEditPatient(null)}
          fetchPatients={fetchPatients}
        />
      )}

      {deletePatient && (
        <DeletePatientModal
          patient={deletePatient}
          isOpen={!!deletePatient}
          onClose={() => setDeletePatient(null)}
          fetchPatients={fetchPatients}
        />
      )}
    </div>
  );
};
