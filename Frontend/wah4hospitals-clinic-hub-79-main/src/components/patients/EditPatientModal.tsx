import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { Patient, PatientFormData } from '../../types/patient';
import axios from 'axios';

interface EditPatientModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
  fetchPatients: () => Promise<void>;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  patient,
  onClose,
  fetchPatients,
}) => {
  const [formData, setFormData] = useState<Omit<PatientFormData, 'patient_id'>>({
    philhealth_id: '',
    national_id: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    sex: 'M',
    date_of_birth: '',
    civil_status: '',
    nationality: '',
    mobile_number: '',
    telephone: '',
    email: '',
    region: '',
    province: '',
    city_municipality: '',
    barangay: '',
    house_no_street: '',
    status: 'Active',
    occupation: '',
  });
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      const { id, patient_id, created_at, updated_at, ...rest } = patient;
      setFormData(rest);
    }
  }, [patient]);

  if (!isOpen) return null;

  const canSave = confirmText === 'EDIT';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);
    try {
      await axios.put(
        `https://supreme-memory-5w9pg5gjv59379g7-8000.app.github.dev/api/patients/${patient.patient_id}/`,
        formData
      );
      await fetchPatients();
      onClose();
    } catch (err) {
      console.error('Failed to update patient:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Edit Patient</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium">Patient ID</label>
              <Input value={patient.patient_id} disabled className="bg-gray-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
              <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
              <InputField label="Middle Name" name="middle_name" value={formData.middle_name || ''} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label="Sex" name="sex" value={formData.sex} onChange={handleChange} />
              <InputField label="Date of Birth" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
              <InputField label="Civil Status" name="civil_status" value={formData.civil_status} onChange={handleChange} />
            </div>

            <InputField label="Occupation" name="occupation" value={formData.occupation || ''} onChange={handleChange} />

            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 mb-1">
                Type <b>EDIT</b> to confirm changes
              </p>
              <Input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type EDIT" />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={!canSave || loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<any> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <Input {...props} />
  </div>
);
