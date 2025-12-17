import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Patient, PatientFormData } from '../../types/patient';
import { EditPatientModal } from './EditPatientModal';
import { DeletePatientModal } from './DeletePatientModal';

interface Props {
  patient: Patient;
  onUpdate: (id: number, data: PatientFormData) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

export const PatientActions: React.FC<Props> = ({
  patient,
  onUpdate,
  onDelete,
  loading
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>

      <EditPatientModal
        isOpen={editOpen}
        patient={patient}
        onClose={() => setEditOpen(false)}
        onSave={(data) => onUpdate(patient.id, data)}
        loading={loading}
      />

      <DeletePatientModal
        isOpen={deleteOpen}
        patientName={`${patient.last_name}, ${patient.first_name}`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => onDelete(patient.id)}
        loading={loading}
      />
    </>
  );
};
