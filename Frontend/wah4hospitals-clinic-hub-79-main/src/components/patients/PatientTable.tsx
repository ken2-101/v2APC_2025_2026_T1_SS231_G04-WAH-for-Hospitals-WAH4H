import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import type { Patient } from '../../types/patient';

interface PatientTableProps {
  patients: Patient[];
  handleViewDetails: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  handleViewDetails
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Patient ID</th>
            <th className="text-left py-3 px-4 font-medium">Full Name</th>
            <th className="text-left py-3 px-4 font-medium">Age</th>
            <th className="text-left py-3 px-4 font-medium">Mobile Number</th>
            <th className="text-left py-3 px-4 font-medium">Department</th>
            <th className="text-left py-3 px-4 font-medium">Room</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b hover:bg-gray-50">
              <td className="py-4 px-4 font-medium">{patient.id}</td>
              <td className="py-4 px-4">{`${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''} ${patient.suffix || ''}`}</td>
              <td className="py-4 px-4">{new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}</td>
              <td className="py-4 px-4">{patient.mobile_number}</td>
              <td className="py-4 px-4">{patient.department}</td>
              <td className="py-4 px-4">{patient.room}</td>
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
      {patients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No patients found matching your search criteria.
        </div>
      )}
    </div>
  );
};
