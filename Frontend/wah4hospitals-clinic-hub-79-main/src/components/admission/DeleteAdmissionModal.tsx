import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import axios from 'axios';

interface DeleteAdmissionModalProps {
  isOpen: boolean;
  admissionId: string; // Admission ID (e.g., "ADM-2025-1234")
  onClose: () => void;
  fetchAdmissions: () => Promise<void>; // Refresh the list after deletion
}

export const DeleteAdmissionModal: React.FC<DeleteAdmissionModalProps> = ({
  isOpen,
  admissionId,
  onClose,
  fetchAdmissions,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canDelete = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete) return;

    setLoading(true);
    setError('');

    try {
      await axios.delete(
        `https://YOUR_BACKEND_URL/api/admissions/${admissionId}/`
      );
      await fetchAdmissions();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete admission:', err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : 'Failed to delete admission'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-600">Delete Admission</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <p className="text-sm mb-2">
          Are you sure you want to delete admission <b>{admissionId}</b>? This action cannot be undone.
        </p>

        <p className="text-sm mb-2">
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
            onClick={handleDelete}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};
