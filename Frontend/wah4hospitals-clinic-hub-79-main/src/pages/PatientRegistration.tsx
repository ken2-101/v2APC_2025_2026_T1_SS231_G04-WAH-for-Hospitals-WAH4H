import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import type { Patient, PatientFormData } from '../types/patient';
import axios from 'axios';

export const PatientRegistration: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState<PatientFormData>({
    id: '',
    philhealth_id: '',
    national_id: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    sex: '',
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
    admission_date: '',
    department: '',
    room: '',
    physician: '',
    condition: '',
    occupation: '',
    passport_number: '',
    drivers_license: '',
    senior_citizen_id: '',
    pwd_id: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    gender: [] as string[],
    department: [] as string[],
    civilStatus: [] as string[],
  });

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get<Patient[]>('/api/patients');
      // Defensive: ensure res.data is always an array
      const patientList = Array.isArray(res.data) ? res.data : [];
      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (err) {
      console.error(err);
      setPatients([]);
      setFilteredPatients([]);
    }
  };

  // Filter & Search
  useEffect(() => {
    let temp = [...patients];

    if (activeFilters.status.length) temp = temp.filter(p => activeFilters.status.includes(p.status));
    if (activeFilters.gender.length) temp = temp.filter(p => activeFilters.gender.includes(p.sex));
    if (activeFilters.department.length) temp = temp.filter(p => activeFilters.department.includes(p.department));
    if (activeFilters.civilStatus.length) temp = temp.filter(p => activeFilters.civilStatus.includes(p.civil_status));

    if (searchQuery) {
      temp = temp.filter(p =>
        `${p.last_name} ${p.first_name} ${p.middle_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.mobile_number.includes(searchQuery)
      );
    }

    setFilteredPatients(temp);
  }, [patients, activeFilters, searchQuery]);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterPatient = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      await axios.post('/api/patients', formData);
      setFormSuccess('Patient registered successfully!');
      setShowRegistrationModal(false);
      setFormData({
        id: '',
        philhealth_id: '',
        national_id: '',
        last_name: '',
        first_name: '',
        middle_name: '',
        suffix: '',
        sex: '',
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
        admission_date: '',
        department: '',
        room: '',
        physician: '',
        condition: '',
        occupation: '',
        passport_number: '',
        drivers_license: '',
        senior_citizen_id: '',
        pwd_id: ''
      });
      fetchPatients();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => {
      const prevValues = prev[filterType as keyof typeof prev];
      return {
        ...prev,
        [filterType]: prevValues.includes(value)
          ? prevValues.filter(v => v !== value)
          : [...prevValues, value]
      };
    });
  };

  const clearFilters = () => {
    setActiveFilters({ status: [], gender: [], department: [], civilStatus: [] });
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:justify-between mb-4 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            patients={Array.isArray(filteredPatients) ? filteredPatients : []}
            handleViewDetails={handleViewDetails}
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
    </div>
  );
};
