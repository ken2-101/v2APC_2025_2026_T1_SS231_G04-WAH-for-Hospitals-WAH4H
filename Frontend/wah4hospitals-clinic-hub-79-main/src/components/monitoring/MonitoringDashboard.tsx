import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonitoringAdmission, PatientStatus } from '../../types/monitoring';

interface MonitoringDashboardProps {
  admissions: MonitoringAdmission[];
  onSelectAdmission: (adm: MonitoringAdmission) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  admissions = [],
  onSelectAdmission,
}) => {
  if (!Array.isArray(admissions) || admissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No patients currently under monitoring.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {admissions.map((adm) => {
        const patientName = adm.patientName || 'Unknown Patient';
        const doctorName = adm.attendingPhysician || 'Unknown Doctor';
        const nurseName = adm.assignedNurse || 'Unknown Nurse';
        const room = adm.room || '—';
        const status: PatientStatus = adm.status || 'Stable';
        const id = adm.id;

        return (
          <Card
            key={id}
            className="cursor-pointer hover:shadow-md transition"
            onClick={() => onSelectAdmission(adm)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                {patientName}
                <Badge variant={status === 'Critical' ? 'destructive' : 'secondary'}>
                  {status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                <strong>Room:</strong> {room}
              </div>
              <div>
                <strong>Doctor:</strong> Dr. {doctorName}
              </div>
              <div>
                <strong>Nurse:</strong> {nurseName}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
