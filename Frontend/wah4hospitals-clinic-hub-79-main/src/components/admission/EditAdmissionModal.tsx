import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { X } from 'lucide-react';
import type { Admission } from '../../types/admission';
import axios from 'axios';

interface EditAdmissionModalProps {
  isOpen: boolean;
  admission: Admission;
  onClose: () => void;
  fetchAdmissions: () => Promise<void>;
}

// Editable fields only (exclude id and patient_details)
type AdmissionForm = Omit<Admission, 'id' | 'patient_details'>;

export const EditAdmissionModal: React.FC<EditAdmissionModalProps> = ({
  isOpen,
  admission,
  onClose,
  fetchAdmissions,
}) => {
  const [formData, setFormData] = useState<AdmissionForm>({
    admission_id: '',
    patient: '',
    admission_date: '',
    encounter_type: 'Inpatient',
    admitting_diagnosis: '',
    reason_for_admission: '',
    ward: '',
    room: '',
    bed: '',
    attending_physician: '',
    assigned_nurse: '',
    admission_category: 'Regular',
    mode_of_arrival: 'Walk-in',
    status: 'Active',
  });

  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when admission changes
  useEffect(() => {
    if (admission) {
      const { id, patient_details, ...rest } = admission;
      setFormData(rest as AdmissionForm); // Type assertion ensures TypeScript knows rest matches AdmissionForm
      setConfirmText('');
      setError('');
    }
  }, [admission]);

  if (!isOpen) return null;

  const canSave = confirmText === 'EDIT';

  const handleChange = (field: keyof AdmissionForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);
    setError('');

    try {
      await axios.put(
        `https://YOUR_BACKEND_URL/api/admissions/${admission.id}/`,
        formData
      );
      await fetchAdmissions();
      onClose();
    } catch (err: any) {
      console.error('Failed to update admission:', err);
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update admission');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Admission</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium">Admission ID</label>
            <Input value={formData.admission_id} disabled className="bg-gray-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Admitting Diagnosis"
              value={formData.admitting_diagnosis}
              onChange={e => handleChange('admitting_diagnosis', e.target.value)}
            />
            <TextareaField
              label="Reason for Admission"
              value={formData.reason_for_admission}
              onChange={e => handleChange('reason_for_admission', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Ward" value={formData.ward} onChange={e => handleChange('ward', e.target.value)} />
            <InputField label="Room" value={formData.room} onChange={e => handleChange('room', e.target.value)} />
            <InputField label="Bed" value={formData.bed} onChange={e => handleChange('bed', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Attending Physician"
              value={formData.attending_physician}
              onChange={e => handleChange('attending_physician', e.target.value)}
            />
            <InputField
              label="Assigned Nurse"
              value={formData.assigned_nurse}
              onChange={e => handleChange('assigned_nurse', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Admission Category"
              value={formData.admission_category}
              onChange={val => handleChange('admission_category', val)}
              options={['Regular', 'Emergency']}
            />
            <SelectField
              label="Mode of Arrival"
              value={formData.mode_of_arrival}
              onChange={val => handleChange('mode_of_arrival', val)}
              options={['Walk-in', 'Ambulance', 'Referral']}
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-700 mb-1">
              Type <b>EDIT</b> to confirm changes
            </p>
            <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type EDIT" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable InputField
const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <Input {...props} />
  </div>
);

// Reusable TextareaField
const TextareaField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <Textarea {...props} />
  </div>
);

// Reusable SelectField
const SelectField: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: string[] }> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${label}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
