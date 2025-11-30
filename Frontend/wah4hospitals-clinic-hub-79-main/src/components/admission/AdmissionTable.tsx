import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import type { Admission } from '../../types/admission';

interface AdmissionTableProps {
  admissions: Admission[];
}

export const AdmissionTable: React.FC<AdmissionTableProps> = ({ admissions }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Patient Name</th>
            <th className="text-left py-3 px-4 font-medium">Admission No.</th>
            <th className="text-left py-3 px-4 font-medium">Date/Time</th>
            <th className="text-left py-3 px-4 font-medium">Physician</th>
            <th className="text-left py-3 px-4 font-medium">Room/Bed</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {admissions.map((admission) => (
            <tr key={admission.id} className="border-b hover:bg-gray-50">
              <td className="py-4 px-4 font-medium">{admission.patientName}</td>
              <td className="py-4 px-4">{admission.id}</td>
              <td className="py-4 px-4">{new Date(admission.admissionDate).toLocaleString()}</td>
              <td className="py-4 px-4">{admission.attendingPhysician}</td>
              <td className="py-4 px-4">
                {admission.ward} - {admission.room} / {admission.bed}
              </td>
              <td className="py-4 px-4">
                <Badge
                  className={
                    admission.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : admission.status === 'Discharged'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {admission.status}
                </Badge>
              </td>
              <td className="py-4 px-4">
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4 mr-1" />
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {admissions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No admissions found matching your search criteria.
        </div>
      )}
    </div>
  );
};
