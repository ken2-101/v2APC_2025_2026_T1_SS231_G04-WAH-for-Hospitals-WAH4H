import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Eye, EyeOff, FileText, Search, Filter, X } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import axios from 'axios';

// Define the Patient type based on your Django model
type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  civil_status: string;
  phone: string;
  address: string;
  occupation: string;
  room: string;
  department: string;
  admission_date: string;
  condition: string;
  physician: string;
  status: string;
  philhealth_id: string;
};

// Form data uses string for all fields (since HTML inputs return strings)
type PatientFormData = {
  id: string;
  name: string;
  age: string;
  gender: string;
  civil_status: string;
  phone: string;
  address: string;
  occupation: string;
  room: string;
  department: string;
  admission_date: string;
  condition: string;
  physician: string;
  status: string;
  philhealth_id: string;
};

// ✅ Moved outside to prevent re-creation on every render
const PatientRegistrationModal = ({
  isOpen,
  onClose,
  formData,
  handleFormChange,
  handleRegisterPatient,
  formLoading,
  success,
  formError
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: PatientFormData;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleRegisterPatient: (e: React.FormEvent) => void;
  formLoading: boolean;
  success: string;
  formError: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Register New Patient</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}
          
          {formError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {formError}
            </div>
          )}

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID *
                </label>
                <Input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., P001"
                  className="w-full"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter full name"
                  className="w-full"
                />
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <Input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleFormChange}
                  required
                  min="0"
                  placeholder="Enter age"
                  className="w-full"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Civil Status */}
              <div>
                <label htmlFor="civil_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Civil Status *
                </label>
                <select
                  id="civil_status"
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter phone number"
                  className="w-full"
                />
              </div>

              {/* Occupation */}
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation *
                </label>
                <Input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter occupation"
                  className="w-full"
                />
              </div>

              {/* Room */}
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
                  Room *
                </label>
                <Input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter room number"
                  className="w-full"
                />
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <Input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter department"
                  className="w-full"
                />
              </div>

              {/* Admission Date */}
              <div>
                <label htmlFor="admission_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date *
                </label>
                <Input
                  type="date"
                  id="admission_date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleFormChange}
                  required
                  className="w-full"
                />
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <Input
                  type="text"
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter condition"
                  className="w-full"
                />
              </div>

              {/* Physician */}
              <div>
                <label htmlFor="physician" className="block text-sm font-medium text-gray-700 mb-1">
                  Physician *
                </label>
                <Input
                  type="text"
                  id="physician"
                  name="physician"
                  value={formData.physician}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter physician name"
                  className="w-full"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* PhilHealth ID */}
              <div>
                <label htmlFor="philhealth_id" className="block text-sm font-medium text-gray-700 mb-1">
                  PhilHealth ID *
                </label>
                <Input
                  type="text"
                  id="philhealth_id"
                  name="philhealth_id"
                  value={formData.philhealth_id}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter PhilHealth ID"
                  className="w-full"
                />
              </div>
            </div>

            {/* Address (Full width) */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                required
                rows={3}
                placeholder="Enter full address"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {formLoading ? 'Creating Patient...' : 'Register Patient'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PatientRegistration = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [showPhilHealthIds, setShowPhilHealthIds] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    gender: [] as string[],
    department: [] as string[],
    civilStatus: [] as string[],
  });

  // New patient form state
  const [formData, setFormData] = useState<PatientFormData>({
    id: '',
    name: '',
    age: '',
    gender: '',
    civil_status: '',
    phone: '',
    address: '',
    occupation: '',
    room: '',
    department: '',
    admission_date: '',
    condition: '',
    physician: '',
    status: '',
    philhealth_id: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch patients from the Django backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get<Patient[]>('http://localhost:8000/api/patients/');
        setPatients(response.data);
      } catch (err) {
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

  const togglePhilHealthVisibility = (patientId: string) => {
    setShowPhilHealthIds(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  const maskPhilHealthId = (id: string) => {
    return id.replace(/(.{3})(.*)(.{4})/, '$1********$3');
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
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
      // Convert age to number for API
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10)
      };

      const response = await axios.post<Patient>('http://localhost:8000/api/patients/', payload);
      setSuccess('Patient created successfully!');
      
      // Add new patient to the list
      setPatients(prev => [...prev, response.data]);
      
      // Reset form
      setFormData({
        id: '',
        name: '',
        age: '',
        gender: '',
        civil_status: '',
        phone: '',
        address: '',
        occupation: '',
        room: '',
        department: '',
        admission_date: '',
        condition: '',
        physician: '',
        status: '',
        philhealth_id: ''
      });
      
      // Close modal after successful registration
      setTimeout(() => {
        setIsRegistrationModalOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data || 'Error creating patient');
      console.error('Error:', err);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.physician.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeFilters.status.length === 0 || activeFilters.status.includes(patient.status);
    const matchesGender = activeFilters.gender.length === 0 || activeFilters.gender.includes(patient.gender);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {hasActiveFilters && (
                      <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                        {Object.values(activeFilters).flat().length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.status.includes('Active')}
                    onCheckedChange={() => handleFilterChange('status', 'Active')}
                  >
                    Active
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.status.includes('Inactive')}
                    onCheckedChange={() => handleFilterChange('status', 'Inactive')}
                  >
                    Inactive
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Gender</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.gender.includes('Male')}
                    onCheckedChange={() => handleFilterChange('gender', 'Male')}
                  >
                    Male
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.gender.includes('Female')}
                    onCheckedChange={() => handleFilterChange('gender', 'Female')}
                  >
                    Female
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.department.includes('General Medicine')}
                    onCheckedChange={() => handleFilterChange('department', 'General Medicine')}
                  >
                    General Medicine
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.department.includes('Cardiology')}
                    onCheckedChange={() => handleFilterChange('department', 'Cardiology')}
                  >
                    Cardiology
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.department.includes('Pediatrics')}
                    onCheckedChange={() => handleFilterChange('department', 'Pediatrics')}
                  >
                    Pediatrics
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.department.includes('Emergency')}
                    onCheckedChange={() => handleFilterChange('department', 'Emergency')}
                  >
                    Emergency
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Civil Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.civilStatus.includes('Single')}
                    onCheckedChange={() => handleFilterChange('civilStatus', 'Single')}
                  >
                    Single
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.civilStatus.includes('Married')}
                    onCheckedChange={() => handleFilterChange('civilStatus', 'Married')}
                  >
                    Married
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.civilStatus.includes('Divorced')}
                    onCheckedChange={() => handleFilterChange('civilStatus', 'Divorced')}
                  >
                    Divorced
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.civilStatus.includes('Widowed')}
                    onCheckedChange={() => handleFilterChange('civilStatus', 'Widowed')}
                  >
                    Widowed
                  </DropdownMenuCheckboxItem>
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
                {filteredPatients.map((patient) => (
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
                            ? patient.philhealth_id 
                            : maskPhilHealthId(patient.philhealth_id)
                          }
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
                      <Badge className={patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {patient.status}
                      </Badge>
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
              <div className="text-center py-8 text-gray-500">
                No patients found matching your search criteria.
              </div>
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
        formData={formData}
        handleFormChange={handleFormChange}
        handleRegisterPatient={handleRegisterPatient}
        formLoading={formLoading}
        success={success}
        formError={formError}
      />
    </div>
  );
};

export default PatientRegistration;