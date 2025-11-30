import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Search, X } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import { PatientTable } from '@/components/patients/PatientTable';
import { PatientFilters } from '@/components/patients/PatientFilters';
import type { Patient, PatientFormData } from '../types/patient';
import axios from 'axios';

const PatientRegistration = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    gender: [] as string[],
    department: [] as string[],
    civilStatus: [] as string[],
  });

  const [formData, setFormData] = useState<PatientFormData>({
    id: '',
    philhealth_id: '',
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
    admission_date: new Date().toISOString().split('T')[0],
    department: '',
    room: '',
    physician: '',
    condition: '',
    occupation: '',
    national_id: '',
    passport_number: '',
    drivers_license: '',
    senior_citizen_id: '',
    pwd_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch patients from the Django backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get<Patient[]>('http://localhost:8000/api/patients/');
        setPatients(response.data);
      } catch (err: any) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    // @ts-ignore
    setActiveFilters(prev => ({
      ...prev,
      // @ts-ignore
      [filterType]: prev[filterType].includes(value)
        // @ts-ignore
        ? prev[filterType].filter(item => item !== value)
        // @ts-ignore
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      status: [],
      gender: [],
      department: [],
      civilStatus: []
    });
  };

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
      };

      const response = await axios.post<Patient>('http://localhost:8000/api/patients/', payload);
      setSuccess('Patient created successfully!');
      
      // Add new patient to the list
      setPatients(prev => [...prev, response.data]);
      
      // Reset form
      setFormData({
        id: '',
        philhealth_id: '',
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
        admission_date: new Date().toISOString().split('T')[0],
        department: '',
        room: '',
        physician: '',
        condition: '',
        occupation: '',
        national_id: '',
        passport_number: '',
        drivers_license: '',
        senior_citizen_id: '',
        pwd_id: '',
      });
      
      // Close modal after successful registration
      setTimeout(() => {
        setIsRegistrationModalOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data || 'Error creating patient');
      console.error('Error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mobile_number.includes(searchTerm) ||
      patient.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.occupation && patient.occupation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.physician && patient.physician.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(patient.status);
    const matchesGender = activeFilters.gender.length === 0 || activeFilters.gender.includes(patient.sex);
    const matchesDepartment = activeFilters.department.length === 0 || activeFilters.department.includes(patient.department);
    const matchesCivilStatus = activeFilters.civilStatus.length === 0 || activeFilters.civilStatus.includes(patient.civil_status);
    return matchesSearch && matchesStatus && matchesGender && matchesDepartment && matchesCivilStatus;
  });

  const hasActiveFilters = Object.values(activeFilters).some(filter => filter.length > 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Records Management</h1>
          <p className="text-gray-600">Comprehensive patient information and registration system</p>
        </div>
        <Button onClick={() => setIsRegistrationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 m-2">
          <UserPlus className="w-4 h-4 mr-2" />
          Register New Patient
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="mb-2 md:mb-0">Patient Directory</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients, ID, phone, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <PatientFilters 
                activeFilters={activeFilters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([filterType, values]) =>
                values.map(value => (
                  <Badge key={`${filterType}-${value}`} variant="secondary" className="flex items-center gap-1">
                    {value}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => handleFilterChange(filterType, value)}
                    />
                  </Badge>
                ))
              )}
            </div>
          )}
          
          <PatientTable 
            patients={filteredPatients}
            handleViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>

      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        formData={formData}
        handleFormChange={handleFormChange}
        handleRegisterPatient={handleRegisterPatient}
        formLoading={formLoading}
        success={success}
        formError={formError}
      />

      {selectedPatient && (
        <PatientDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          patient={selectedPatient}
        />
      )}
    </div>
  );
};

export default PatientRegistration;