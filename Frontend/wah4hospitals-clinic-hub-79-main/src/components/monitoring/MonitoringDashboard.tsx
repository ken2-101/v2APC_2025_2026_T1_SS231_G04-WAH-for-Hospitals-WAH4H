import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonitoringPatient } from '../../types/monitoring';

interface MonitoringDashboardProps {
  patients?: MonitoringPatient[]; // ⬅ allow undefined
  onSelectPatient: (patient: MonitoringPatient) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  patients = [], // ⬅ DEFAULT VALUE (CRITICAL)
  onSelectPatient,
}) => {
  if (!Array.isArray(patients) || patients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No patients currently under monitoring.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {patients.map(patient => (
        <Card
          key={patient.id}
          className="cursor-pointer hover:shadow-md transition"
          onClick={() => onSelectPatient(patient)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex justify-between items-center">
              {patient.patientName}
              <Badge
                variant={
                  patient.status === 'Critical'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {patient.status}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm space-y-1">
            <div><strong>Room:</strong> {patient.room}</div>
            <div><strong>Doctor:</strong> Dr. {patient.doctorName}</div>
            <div><strong>Nurse:</strong> {patient.nurseName}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
