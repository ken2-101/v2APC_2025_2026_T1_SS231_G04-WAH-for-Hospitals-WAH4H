import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, FileText } from 'lucide-react';
import type { Patient } from '../../types/patient';

interface PatientTableProps {
  patients: Patient[];
  showPhilHealthIds: Record<string, boolean>;
  togglePhilHealthVisibility: (patientId: string) => void;
  maskPhilHealthId: (id: string) => string;
  handleViewDetails: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  showPhilHealthIds,
  togglePhilHealthVisibility,
  maskPhilHealthId,
  handleViewDetails
}) => {
  return (
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
          {patients.map((patient) => (
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
      {patients.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No patients found matching your search criteria.
        </div>
      )}
    </div>
  );
};
