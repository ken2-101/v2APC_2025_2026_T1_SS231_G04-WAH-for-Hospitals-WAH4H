import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeletePatientModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
  onConfirmDelete: () => void;
  loading: boolean;
}

export const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  patientName,
  onClose,
  onConfirmDelete,
  loading
}) => {
  const [confirmation, setConfirmation] = useState('');

  if (!isOpen) return null;

  const isValid = confirmation === 'DELETE';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-red-600 mb-2">
          Confirm Patient Deletion
        </h3>

        <p className="text-sm text-gray-700 mb-4">
          You are about to permanently delete <b>{patientName}</b>.
          <br />
          This action <b>cannot be undone</b>.
        </p>

        <p className="text-sm mb-2">
          Type <b className="text-red-600">DELETE</b> to confirm:
        </p>

        <Input
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          placeholder="Type DELETE"
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isValid || loading}
            onClick={onConfirmDelete}
          >
            {loading ? 'Deleting...' : 'Delete Patient'}
          </Button>
        </div>
      </div>
    </div>
  );
};
