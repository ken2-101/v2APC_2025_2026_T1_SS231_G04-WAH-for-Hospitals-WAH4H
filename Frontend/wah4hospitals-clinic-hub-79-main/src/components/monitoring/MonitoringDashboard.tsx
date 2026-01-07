import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { MonitoringAdmission, PatientStatus } from '../../types/monitoring';

interface MonitoringDashboardProps {
  admissions: MonitoringAdmission[];
  onSelectAdmission: (adm: MonitoringAdmission) => void;
}

const getStatusBadgeClass = (status: PatientStatus) => {
  switch (status) {
    case 'Stable':
      return 'bg-green-100 text-green-800';
    case 'Critical':
      return 'bg-red-100 text-red-800';
    case 'Observation':
      return 'bg-yellow-100 text-yellow-800';
    case 'Recovering':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  admissions = [],
  onSelectAdmission,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">Patient Name</th>
            <th className="text-left py-3 px-4 font-medium">Room</th>
            <th className="text-left py-3 px-4 font-medium">Physician</th>
            <th className="text-left py-3 px-4 font-medium">Nurse</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-center py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>

        <tbody>
          {admissions.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No patients found matching your search criteria.
              </td>
            </tr>
          )}

          {admissions.map((adm) => {
            const patientName = adm.patientName || 'Unknown';
            const doctorName = adm.attendingPhysician || 'Unknown';
            const nurseName = adm.assignedNurse || 'Unknown';
            const room = adm.room || '—';
            const status: PatientStatus = adm.status || 'Stable';

            return (
              <tr key={adm.id} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4 font-medium">{patientName}</td>
                <td className="py-4 px-4">{room}</td>
                <td className="py-4 px-4">Dr. {doctorName}</td>
                <td className="py-4 px-4">{nurseName}</td>
                <td className="py-4 px-4">
                  <Badge className={getStatusBadgeClass(status)}>
                    {status}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectAdmission(adm)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Monitoring
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
