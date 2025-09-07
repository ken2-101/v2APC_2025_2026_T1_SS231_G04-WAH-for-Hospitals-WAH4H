import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

const PatientRegistration = () => {
  const [patients, setPatients] = useState([
    {
      id: 'P001',
      name: 'Maria Santos',
      age: 45,
      gender: 'Female',
      civilStatus: 'Married',
      phone: '+63 912 345 6789',
      address: '123 Rizal Street, Makati City, Metro Manila',
      occupation: 'Teacher',
      room: 'Room 101',
      department: 'General Medicine',
      admissionDate: '2024-01-15',
      condition: 'Stable',
      physician: 'Dr. Juan Cruz',
      status: 'Active',
      philhealthId: 'PH-123456789012'
    },
    {
      id: 'P002',
      name: 'Jose Dela Cruz',
      age: 62,
      gender: 'Male',
      civilStatus: 'Widowed',
      phone: '+63 917 987 6543',
      address: '456 Bonifacio Avenue, Quezon City, Metro Manila',
      occupation: 'Retired Engineer',
      room: 'Room 205',
      department: 'Cardiology',
      admissionDate: '2024-01-14',
      condition: 'Monitoring',
      physician: 'Dr. Ana Reyes',
      status: 'Active',
      philhealthId: 'PH-987654321098'
    },
    {
      id: 'P003',
      name: 'Ana Rodriguez',
      age: 28,
      gender: 'Female',
      civilStatus: 'Single',
      phone: '+63 920 123 4567',
      address: '789 Luna Street, Pasig City, Metro Manila',
      occupation: 'Nurse',
      room: 'Room 303',
      department: 'Pediatrics',
      admissionDate: '2024-01-16',
      condition: 'Stable',
      physician: 'Dr. Maria Lopez',
      status: 'Active',
      philhealthId: 'PH-456789123456'
    },
    {
      id: 'P004',
      name: 'Carlos Mendoza',
      age: 35,
      gender: 'Male',
      civilStatus: 'Married',
      phone: '+63 918 765 4321',
      address: '321 Taft Avenue, Manila City, Metro Manila',
      occupation: 'Engineer',
      room: 'Room 402',
      department: 'Orthopedics',
      admissionDate: '2024-01-17',
      condition: 'Recovering',
      physician: 'Dr. Pedro Santos',
      status: 'Active',
      philhealthId: 'PH-789012345678'
    },
    {
      id: 'P005',
      name: 'Luz Garcia',
      age: 58,
      gender: 'Female',
      civilStatus: 'Married',
      phone: '+63 915 888 9999',
      address: '654 EDSA, Quezon City, Metro Manila',
      occupation: 'Accountant',
      room: 'Room 501',
      department: 'Neurology',
      admissionDate: '2024-01-18',
      condition: 'Critical',
      physician: 'Dr. Luis Fernandez',
      status: 'Active',
      philhealthId: 'PH-012345678901'
    },
    {
      id: 'P006',
      name: 'Roberto Silva',
      age: 41,
      gender: 'Male',
      civilStatus: 'Divorced',
      phone: '+63 922 111 2222',
      address: '987 Ortigas Avenue, Pasig City, Metro Manila',
      occupation: 'Sales Manager',
      room: 'Room 202',
      department: 'General Medicine',
      admissionDate: '2024-01-19',
      condition: 'Stable',
      physician: 'Dr. Carmen Reyes',
      status: 'Inactive',
      philhealthId: 'PH-345678901234'
    },
    {
      id: 'P007',
      name: 'Elena Morales',
      age: 32,
      gender: 'Female',
      civilStatus: 'Single',
      phone: '+63 919 333 4444',
      address: '147 Shaw Boulevard, Mandaluyong City, Metro Manila',
      occupation: 'Graphic Designer',
      room: 'Room 304',
      department: 'Dermatology',
      admissionDate: '2024-01-20',
      condition: 'Stable',
      physician: 'Dr. Antonio Cruz',
      status: 'Active',
      philhealthId: 'PH-678901234567'
    },
    {
      id: 'P008',
      name: 'Miguel Torres',
      age: 67,
      gender: 'Male',
      civilStatus: 'Widowed',
      phone: '+63 916 555 6666',
      address: '258 Commonwealth Avenue, Quezon City, Metro Manila',
      occupation: 'Retired Teacher',
      room: 'Room 403',
      department: 'Cardiology',
      admissionDate: '2024-01-21',
      condition: 'Monitoring',
      physician: 'Dr. Sofia Martinez',
      status: 'Active',
      philhealthId: 'PH-901234567890'
    },
    {
      id: 'P009',
      name: 'Carmen Flores',
      age: 39,
      gender: 'Female',
      civilStatus: 'Married',
      phone: '+63 921 777 8888',
      address: '369 C5 Road, Taguig City, Metro Manila',
      occupation: 'Marketing Director',
      room: 'Room 502',
      department: 'Gastroenterology',
      admissionDate: '2024-01-22',
      condition: 'Stable',
      physician: 'Dr. Ricardo Valdez',
      status: 'Active',
      philhealthId: 'PH-234567890123'
    },
    {
      id: 'P010',
      name: 'Diego Herrera',
      age: 24,
      gender: 'Male',
      civilStatus: 'Single',
      phone: '+63 917 999 0000',
      address: '741 Katipunan Avenue, Quezon City, Metro Manila',
      occupation: 'Student',
      room: 'Room 203',
      department: 'Emergency',
      admissionDate: '2024-01-23',
      condition: 'Stable',
      physician: 'Dr. Isabel Navarro',
      status: 'Active',
      philhealthId: 'PH-567890123456'
    },
    {
      id: 'P011',
      name: 'Patricia Ramos',
      age: 53,
      gender: 'Female',
      civilStatus: 'Married',
      phone: '+63 923 123 1234',
      address: '852 Alabang-Zapote Road, Las Piñas City, Metro Manila',
      occupation: 'Bank Manager',
      room: 'Room 305',
      department: 'Endocrinology',
      admissionDate: '2024-01-24',
      condition: 'Monitoring',
      physician: 'Dr. Gabriel Ruiz',
      status: 'Active',
      philhealthId: 'PH-890123456789'
    },
    {
      id: 'P012',
      name: 'Fernando Castro',
      age: 46,
      gender: 'Male',
      civilStatus: 'Married',
      phone: '+63 918 234 5678',
      address: '963 Sucat Road, Parañaque City, Metro Manila',
      occupation: 'IT Manager',
      room: 'Room 404',
      department: 'Urology',
      admissionDate: '2024-01-25',
      condition: 'Stable',
      physician: 'Dr. Valentina Guerrero',
      status: 'Inactive',
      philhealthId: 'PH-123456780912'
    },
    {
      id: 'P013',
      name: 'Isabella Vargas',
      age: 29,
      gender: 'Female',
      civilStatus: 'Single',
      phone: '+63 920 345 6789',
      address: '159 Marcos Highway, Marikina City, Metro Manila',
      occupation: 'Physical Therapist',
      room: 'Room 503',
      department: 'Rehabilitation',
      admissionDate: '2024-01-26',
      condition: 'Recovering',
      physician: 'Dr. Emilio Jimenez',
      status: 'Active',
      philhealthId: 'PH-456789012345'
    },
    {
      id: 'P014',
      name: 'Ricardo Medina',
      age: 55,
      gender: 'Male',
      civilStatus: 'Divorced',
      phone: '+63 915 456 7890',
      address: '357 Roxas Boulevard, Manila City, Metro Manila',
      occupation: 'Lawyer',
      room: 'Room 204',
      department: 'Psychiatry',
      admissionDate: '2024-01-27',
      condition: 'Stable',
      physician: 'Dr. Claudia Moreno',
      status: 'Active',
      philhealthId: 'PH-789012346578'
    },
    {
      id: 'P015',
      name: 'Gabriela Ortiz',
      age: 33,
      gender: 'Female',
      civilStatus: 'Married',
      phone: '+63 922 567 8901',
      address: '753 Gil Puyat Avenue, Makati City, Metro Manila',
      occupation: 'Architect',
      room: 'Room 306',
      department: 'Obstetrics',
      admissionDate: '2024-01-28',
      condition: 'Stable',
      physician: 'Dr. Rodrigo Peña',
      status: 'Active',
      philhealthId: 'PH-012345679012'
    },
    {
      id: 'P016',
      name: 'Alejandro Vega',
      age: 38,
      gender: 'Male',
      civilStatus: 'Single',
      phone: '+63 919 678 9012',
      address: '951 Araneta Avenue, Quezon City, Metro Manila',
      occupation: 'Chef',
      room: 'Room 405',
      department: 'General Surgery',
      admissionDate: '2024-01-29',
      condition: 'Post-Op',
      physician: 'Dr. Beatriz Aguilar',
      status: 'Active',
      philhealthId: 'PH-345678901235'
    },
    {
      id: 'P017',
      name: 'Natalia Campos',
      age: 27,
      gender: 'Female',
      civilStatus: 'Single',
      phone: '+63 916 789 0123',
      address: '486 Pioneer Street, Mandaluyong City, Metro Manila',
      occupation: 'Social Worker',
      room: 'Room 504',
      department: 'Pediatrics',
      admissionDate: '2024-01-30',
      condition: 'Stable',
      physician: 'Dr. Sergio Romero',
      status: 'Active',
      philhealthId: 'PH-678901234568'
    },
    {
      id: 'P018',
      name: 'Joaquin Salazar',
      age: 44,
      gender: 'Male',
      civilStatus: 'Married',
      phone: '+63 921 890 1234',
      address: '672 España Boulevard, Manila City, Metro Manila',
      occupation: 'Professor',
      room: 'Room 205',
      department: 'Oncology',
      admissionDate: '2024-01-31',
      condition: 'Treatment',
      physician: 'Dr. Andrea Molina',
      status: 'Active',
      philhealthId: 'PH-901234567891'
    },
    {
      id: 'P019',
      name: 'Esperanza Luna',
      age: 61,
      gender: 'Female',
      civilStatus: 'Widowed',
      phone: '+63 923 901 2345',
      address: '134 Kalayaan Avenue, Quezon City, Metro Manila',
      occupation: 'Retired Nurse',
      room: 'Room 307',
      department: 'Geriatrics',
      admissionDate: '2024-02-01',
      condition: 'Monitoring',
      physician: 'Dr. Francisco Herrera',
      status: 'Inactive',
      philhealthId: 'PH-234567890124'
    },
    {
      id: 'P020',
      name: 'Maximiliano Rivera',
      age: 31,
      gender: 'Male',
      civilStatus: 'Married',
      phone: '+63 917 012 3456',
      address: '245 Ayala Avenue, Makati City, Metro Manila',
      occupation: 'Financial Analyst',
      room: 'Room 406',
      department: 'Internal Medicine',
      admissionDate: '2024-02-02',
      condition: 'Stable',
      physician: 'Dr. Victoria Sandoval',
      status: 'Active',
      philhealthId: 'PH-567890123457'
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [showPhilHealthIds, setShowPhilHealthIds] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: [],
    gender: [],
    department: [],
    civilStatus: []
  });

  const handleViewDetails = (patient: any) => {
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

  const handleRegisterPatient = (patientData: any) => {
    const newPatientRecord = {
      id: `P${String(patients.length + 1).padStart(3, '0')}`,
      name: `${patientData.firstName} ${patientData.lastName}`,
      age: calculateAge(patientData.birthDate),
      gender: patientData.gender,
      civilStatus: 'Single', // Default value
      phone: patientData.contactNumber,
      address: patientData.completeAddress,
      occupation: 'Not specified', // Default value
      room: `Room ${Math.floor(Math.random() * 500) + 100}`,
      department: getDepartmentFromReason(patientData.reasonForVisit),
      admissionDate: new Date().toISOString().split('T')[0],
      condition: 'Stable',
      physician: 'Dr. Assignment Pending',
      status: 'Active',
      philhealthId: patientData.philhealthId || 'Not provided'
    };

    setPatients(prev => [...prev, newPatientRecord]);
    setIsRegistrationModalOpen(false);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getDepartmentFromReason = (reason: string) => {
    const departmentMap = {
      'routine-checkup': 'General Medicine',
      'emergency': 'Emergency',
      'surgery': 'Surgery',
      'consultation': 'General Medicine',
      'follow-up': 'General Medicine'
    };
    return departmentMap[reason] || 'General Medicine';
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
    const matchesCivilStatus = activeFilters.civilStatus.length === 0 || activeFilters.civilStatus.includes(patient.civilStatus);

    return matchesSearch && matchesStatus && matchesGender && matchesDepartment && matchesCivilStatus;
  });

  const hasActiveFilters = Object.values(activeFilters).some(filter => filter.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Records Management</h1>
          <p className="text-gray-600">Comprehensive patient information and registration system</p>
        </div>
        <Button onClick={() => setIsRegistrationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Register New Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Patient Directory</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients, ID, phone, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
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
                            ? patient.philhealthId 
                            : maskPhilHealthId(patient.philhealthId)
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
        onRegister={handleRegisterPatient}
      />
    </div>
  );
};

export default PatientRegistration;
