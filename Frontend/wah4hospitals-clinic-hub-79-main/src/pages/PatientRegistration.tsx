// PatientRegistration.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Download } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import { EditPatientModal } from '@/components/patients/EditPatientModal';
import { DeletePatientModal } from '@/components/patients/DeletePatientModal';
import type { Patient, PatientFormData } from '../types/patient';
import axios from 'axios';

// NOTE: Ensure trailing slash for Django
const API_URL = 'http://127.0.0.1:8000/api/patients/';

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
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix_name: '',
    gender: 'M',
    birthdate: '',
    civil_status: '',
    nationality: '',
    religion: '',
    philhealth_id: '',
    blood_type: '',
    pwd_type: '',
    occupation: '',
    education: '',
    mobile_number: '',
    address_line: '',
    address_city: '',
    address_district: '',
    address_state: '',
    address_postal_code: '',
    address_country: 'Philippines', // Default
    contact_first_name: '',
    contact_last_name: '',
    contact_mobile_number: '',
    contact_relationship: '',
    indigenous_flag: false,
    indigenous_group: '',
    consent_flag: true
  };

  const [formData, setFormData] = useState({ ...initialFormData });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  // WAH4PC integration state
  const [philHealthId, setPhilHealthId] = useState('');
  const [targetProvider, setTargetProvider] = useState('');
  const [wah4pcLoading, setWah4pcLoading] = useState(false);

  const fetchFromWAH4PC = async () => {
    setWah4pcLoading(true);
    try {
      await axios.post(`${API_URL}wah4pc/fetch`, {
        targetProviderId: targetProvider,
        philHealthId,
      });
      alert('Request sent to WAH4PC. You will receive the data via webhook.');
    } catch (err) {
      console.error('WAH4PC fetch error:', err);
      alert('Failed to send WAH4PC request.');
    } finally {
      setWah4pcLoading(false);
    }
  };

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
    if (activeFilters.status.length) {
      temp = temp.filter(p => {
        const status = p.active ? 'Active' : 'Inactive';
        return activeFilters.status.includes(status);
      });
    }
    if (activeFilters.gender.length) temp = temp.filter(p => activeFilters.gender.includes(p.gender));
    if (activeFilters.civilStatus.length) temp = temp.filter(p => activeFilters.civilStatus.includes(p.civil_status));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter(
        p => `${p.last_name} ${p.first_name} ${p.middle_name || ''}`.toLowerCase().includes(q) ||
          (p.patient_id && p.patient_id.toLowerCase().includes(q)) ||
          (p.mobile_number && p.mobile_number.includes(searchQuery))
      );
    }
    setFilteredPatients(temp);
  }, [patients, activeFilters, searchQuery]);

  // Form handlers
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterPatient = async (patientData: PatientFormData) => {
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await axios.post(API_URL, patientData);
      const registeredPatient: Patient = res.data;
      setFormSuccess(`Patient registered successfully! ID: ${registeredPatient.patient_id}`);
      // Don't close modal here - let modal close itself on success
      fetchPatients();
      // Return success - modal will close after this resolves
    } catch (err: any) {
      console.error('Full Axios error:', err);
      console.error('Error response data:', err.response?.data);
      if (err.response) {
        const messages = typeof err.response.data === 'object'
          ? Object.entries(err.response.data).map(([f, m]) => Array.isArray(m) ? `${f}: ${m.join(', ')}` : `${f}: ${m}`).join('\n')
          : err.response.data;
        setFormError(messages);
      } else {
        setFormError(err.message || 'Failed to register patient');
      }
      // Re-throw error so modal knows to stay open
      throw err;
    } finally {
      setFormLoading(false);
    }
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

          {/* WAH4PC Fetch Section */}
          <div className="flex flex-col md:flex-row gap-2 mb-4 p-3 border rounded-lg bg-gray-50">
            <Input
              value={philHealthId}
              onChange={e => setPhilHealthId(e.target.value)}
              placeholder="PhilHealth ID"
              className="max-w-xs"
            />
            <Input
              value={targetProvider}
              onChange={e => setTargetProvider(e.target.value)}
              placeholder="Target Provider ID"
              className="max-w-xs"
            />
            <Button
              onClick={fetchFromWAH4PC}
              disabled={wah4pcLoading || !philHealthId || !targetProvider}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {wah4pcLoading ? 'Fetching...' : 'Fetch from WAH4PC'}
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
        onSuccess={handleRegisterPatient}
        isLoading={formLoading}
        error={formError}
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
