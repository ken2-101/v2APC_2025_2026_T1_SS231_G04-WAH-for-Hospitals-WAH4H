import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Eye, EyeOff, FileText, Search, Filter, X } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

// ✅ Define Patient type
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  department: string;
  philhealthId: string;
  status: string;
  occupation?: string;
  physician?: string;
  civilStatus?: string;
}

const PatientRegistration: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [showPhilHealthIds, setShowPhilHealthIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    status: string[];
    gender: string[];
    department: string[];
    civilStatus: string[];
  }>({ status: [], gender: [], department: [], civilStatus: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients
  const fetchPatients = async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data: Patient[] = await res.json();
      setPatients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleViewDetails = (patient: Patient): void => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  const togglePhilHealthVisibility = (patientId: string): void => {
    setShowPhilHealthIds(prev => ({ ...prev, [patientId]: !prev[patientId] }));
  };

  const maskPhilHealthId = (id: string): string => id.replace(/(.{3})(.*)(.{4})/, '$1********$3');

  const handleFilterChange = (filterType: keyof typeof activeFilters, value: string): void => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value],
    }));
  };

  const clearFilters = (): void => {
    setActiveFilters({ status: [], gender: [], department: [], civilStatus: [] });
  };

  const handleRegisterPatient = async (patientData: Patient): Promise<void> => {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      });
      if (!res.ok) throw new Error('Failed to register patient');
      const newPatient: Patient = await res.json();
      setPatients(prev => [...prev, newPatient]);
      setIsRegistrationModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (patient.physician?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(patient.status);
    const matchesGender = activeFilters.gender.length === 0 || activeFilters.gender.includes(patient.gender);
    const matchesDepartment = activeFilters.department.length === 0 || activeFilters.department.includes(patient.department);
    const matchesCivilStatus = activeFilters.civilStatus.length === 0 || activeFilters.civilStatus.includes(patient.civilStatus ?? '');

    return matchesSearch && matchesStatus && matchesGender && matchesDepartment && matchesCivilStatus;
  });

  const hasActiveFilters = (Object.values(activeFilters) as string[][]).some(filter => filter.length > 0);

  if (loading) return <div>Loading patients...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header & Register Button */}
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

      {/* Patient Directory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="mb-2 md:mb-0">Patient Directory</CardTitle>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients, ID, phone, department..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {hasActiveFilters && (
                      <span className="ml-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {Object.values(activeFilters).flat().length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  {['Active', 'Inactive'].map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={activeFilters.status.includes(status)}
                      onCheckedChange={() => handleFilterChange('status', status)}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Gender</DropdownMenuLabel>
                  {['Male', 'Female'].map(g => (
                    <DropdownMenuCheckboxItem
                      key={g}
                      checked={activeFilters.gender.includes(g)}
                      onCheckedChange={() => handleFilterChange('gender', g)}
                    >
                      {g}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                  {['General Medicine', 'Cardiology'].map(dep => (
                    <DropdownMenuCheckboxItem
                      key={dep}
                      checked={activeFilters.department.includes(dep)}
                      onCheckedChange={() => handleFilterChange('department', dep)}
                    >
                      {dep}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Civil Status</DropdownMenuLabel>
                  {['Single', 'Married'].map(cs => (
                    <DropdownMenuCheckboxItem
                      key={cs}
                      checked={activeFilters.civilStatus.includes(cs)}
                      onCheckedChange={() => handleFilterChange('civilStatus', cs)}
                    >
                      {cs}
                    </DropdownMenuCheckboxItem>
                  ))}

                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters} className="text-red-600">
                        <X className="w-4 h-4 mr-2" />
                        Clear All Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

  <CardContent>
  {/* Active Filter Badges */}
  {hasActiveFilters && (
    <div className="mb-4 flex flex-wrap gap-2">
      {(Object.entries(activeFilters) as [keyof typeof activeFilters, string[]][]).map(
        ([filterType, values]) =>
          values.map(value => (
            <div
              key={`${String(filterType)}-${value}`}
              className="flex items-center gap-1 px-2 py-1 text-sm rounded bg-blue-100 text-blue-800"
            >
              {value}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => handleFilterChange(filterType, value)}
              />
            </div>
          ))
      )}
    </div>
  )}

  {/* Patients Table */}
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b">
          <th className="text-left py-3 px-4 font-medium">Patient ID</th>
          <th className="text-left py-3 px-4 font-medium">Name</th>
          <th className="text-left py-3 px-4 font-medium">Age</th>
          <th className="text-left py-3 px-4 font-medium">Gender</th>
          <th className="text-left py-3 px-4 font-medium">Phone</th>
          <th className="text-left py-3 px-4 font-medium">Department</th>
          <th className="text-left py-3 px-4 font-medium">PhilHealth ID</th>
          <th className="text-left py-3 px-4 font-medium">Status</th>
          <th className="text-left py-3 px-4 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPatients.map((patient: Patient) => (
          <tr key={patient.id} className="border-b hover:bg-gray-50">
            <td className="py-4 px-4 font-medium">{patient.id}</td>
            <td className="py-4 px-4">{patient.name}</td>
            <td className="py-4 px-4">{patient.age}</td>
            <td className="py-4 px-4">{patient.gender}</td>
            <td className="py-4 px-4">{patient.phone}</td>
            <td className="py-4 px-4">{patient.department}</td>
            <td className="py-4 px-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {showPhilHealthIds[patient.id]
                    ? patient.philhealthId
                    : maskPhilHealthId(patient.philhealthId)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePhilHealthVisibility(patient.id)}
                  className="h-6 w-6 p-0"
                >
                  {showPhilHealthIds[patient.id] ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </td>
            <td className="py-4 px-4">
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  patient.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {patient.status}
              </span>
            </td>
            <td className="py-4 px-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(patient)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Details
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {filteredPatients.length === 0 && (
      <div className="text-center py-8 text-gray-500">No patients found.</div>
    )}
  </div>
</CardContent>


      </Card>

      <PatientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        patient={selectedPatient}
      />
      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={handleRegisterPatient}
      />
    </div>
  );
};

export default PatientRegistration;
