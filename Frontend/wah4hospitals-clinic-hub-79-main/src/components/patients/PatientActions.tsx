import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeletePatientModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  patientName,
  onClose,
  onConfirm,
  loading
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const canDelete = confirmText === 'DELETE';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-red-600 mb-2">
          Confirm Delete
        </h3>

        <p className="text-sm mb-4">
          You are about to delete <b>{patientName}</b>.
          <br />This action cannot be undone.
        </p>

        <p className="text-sm mb-1">
          Type <b>DELETE</b> to confirm:
        </p>

        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE"
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete || loading}
            onClick={onConfirm}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};
