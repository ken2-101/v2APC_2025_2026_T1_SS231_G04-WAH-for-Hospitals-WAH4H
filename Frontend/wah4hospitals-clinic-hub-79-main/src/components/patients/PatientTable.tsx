// File: /components/patients/PatientTable.tsx
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Patient } from '../../types/patient';

interface PatientTableProps {
  patients: Patient[];
  handleViewDetails: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({ patients, handleViewDetails }) => {
  if (!patients.length) {
    return <p className="text-center py-4 text-gray-500">No patients found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient ID</TableHead>
          <TableHead>Full Name</TableHead>
          <TableHead>Sex</TableHead>
          <TableHead>Civil Status</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>{patient.patient_id}</TableCell>
            <TableCell>{`${patient.last_name}, ${patient.first_name} ${patient.middle_name ?? ''} ${patient.suffix ?? ''}`.trim()}</TableCell>
            <TableCell>{patient.sex === 'M' ? 'Male' : 'Female'}</TableCell>
            <TableCell>{patient.civil_status}</TableCell>
            <TableCell>{patient.status}</TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onClick={() => handleViewDetails(patient)}>
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
