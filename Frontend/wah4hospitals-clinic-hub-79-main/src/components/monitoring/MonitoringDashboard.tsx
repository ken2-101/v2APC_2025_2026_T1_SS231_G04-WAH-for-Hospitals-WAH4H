import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { MonitoringAdmission, PatientStatus } from '../../types/monitoring';

interface MonitoringDashboardProps {
  admissions: MonitoringAdmission[];
  onSelectAdmission: (adm: MonitoringAdmission) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  admissions = [],
  onSelectAdmission,
}) => {
  if (!admissions.length) {
    return (
      <div className="text-center text-gray-500 py-6">
        No patients currently under monitoring.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Patient Name</th>
            <th className="px-4 py-2 text-left">Room</th>
            <th className="px-4 py-2 text-left">Doctor</th>
            <th className="px-4 py-2 text-left">Nurse</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {admissions.map((adm) => {
            const patientName = adm.patientName || 'Unknown';
            const doctorName = adm.attendingPhysician || 'Unknown';
            const nurseName = adm.assignedNurse || 'Unknown';
            const room = adm.room || '—';
            const status: PatientStatus = adm.status || 'Stable';

            return (
              <tr key={adm.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{patientName}</td>
                <td className="px-4 py-2">{room}</td>
                <td className="px-4 py-2">Dr. {doctorName}</td>
                <td className="px-4 py-2">{nurseName}</td>
                <td className="px-4 py-2">
                  <Badge
                    variant={status === 'Critical' ? 'destructive' : 'secondary'}
                  >
                    {status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectAdmission(adm)}
                    >
                      <Eye className="w-4 h-4" />
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
