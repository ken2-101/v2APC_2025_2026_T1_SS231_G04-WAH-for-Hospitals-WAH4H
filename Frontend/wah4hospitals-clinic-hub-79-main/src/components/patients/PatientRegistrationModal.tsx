import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PatientFormData } from '../../types/patient';
import addressData from '../../data/addressData.json';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: PatientFormData;
  handleFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleRegisterPatient: (e: React.FormEvent) => void;
  formLoading: boolean;
  success: string;
  formError: string;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  formData,
  handleFormChange,
  handleRegisterPatient,
  formLoading,
  success,
  formError
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Register New Patient</DialogTitle>
        </DialogHeader>

        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}
        {formError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{formError}</div>}

        <form onSubmit={handleRegisterPatient} className="space-y-6">
          {/* Patient ID */}
          <div>
            <label htmlFor="patient_id" className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
            <Input
              type="text"
              id="patient_id"
              name="patient_id"
              value={formData.patient_id || 'PXXXX'}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Identity & Personal Info */}
          <div>
            <h4 className="text-lg font-semibold mb-3 border-b pb-2">Identity & Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InputField label="Last Name *" name="last_name" value={formData.last_name} onChange={handleFormChange} required />
              <InputField label="First Name *" name="first_name" value={formData.first_name} onChange={handleFormChange} required />
              <InputField label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleFormChange} />
              <InputField label="Suffix" name="suffix" value={formData.suffix} onChange={handleFormChange} placeholder="e.g., Jr, III" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <SelectField label="Sex *" name="sex" value={formData.sex} onChange={handleFormChange} required options={[
                { value: '', label: 'Select' },
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' }
              ]} />
              <InputField label="Date of Birth *" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleFormChange} required />
              <SelectField label="Civil Status *" name="civil_status" value={formData.civil_status} onChange={handleFormChange} required options={[
                { value: '', label: 'Select' },
                { value: 'Single', label: 'Single' },
                { value: 'Married', label: 'Married' },
                { value: 'Divorced', label: 'Divorced' },
                { value: 'Widowed', label: 'Widowed' },
                { value: 'Separated', label: 'Separated' }
              ]} />
              <InputField label="Nationality *" name="nationality" value={formData.nationality} onChange={handleFormChange} required />
            </div>

            {/* Occupation */}
            <div className="mt-4">
              <InputField label="Occupation" name="occupation" value={formData.occupation} onChange={handleFormChange} placeholder="e.g., Teacher, Engineer" />
            </div>
          </div>

          {/* Address */}
          <AddressFields formData={formData} handleFormChange={handleFormChange} />

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={formLoading}>Cancel</Button>
            <Button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700">
              {formLoading ? 'Creating Patient...' : 'Register Patient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// --------------------------
// Reusable Input Components
// --------------------------
const InputField: React.FC<any> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <Input {...props} />
  </div>
);

const SelectField: React.FC<any> = ({ label, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full rounded-md border border-gray-300 px-3 py-2">
      {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// --------------------------
// Address Fields
// --------------------------
const AddressFields: React.FC<{ formData: PatientFormData, handleFormChange: any }> = ({ formData, handleFormChange }) => (
  <div>
    <h4 className="text-lg font-semibold mb-3 border-b pb-2">Address (PSGC)</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SelectField
        label="Region *"
        name="region"
        value={formData.region}
        onChange={handleFormChange}
        required
        options={[{ value: '', label: 'Select Region' }, ...addressData.regions.map((r: any) => ({ value: r.code, label: r.name }))]}
      />
      <SelectField
        label="Province *"
        name="province"
        value={formData.province}
        onChange={handleFormChange}
        required
        disabled={!formData.region}
        options={[{ value: '', label: 'Select Province' }, ...(formData.region ? addressData.provinces[formData.region]?.map((p: any) => ({ value: p.code, label: p.name })) || [] : [])]}
      />
      <SelectField
        label="City/Municipality *"
        name="city_municipality"
        value={formData.city_municipality}
        onChange={handleFormChange}
        required
        disabled={!formData.province}
        options={[{ value: '', label: 'Select City/Municipality' }, ...(formData.province ? addressData.cities[formData.province]?.map((c: any) => ({ value: c.code, label: c.name })) || [] : [])]}
      />
      <SelectField
        label="Barangay *"
        name="barangay"
        value={formData.barangay}
        onChange={handleFormChange}
        required
        disabled={!formData.city_municipality}
        options={[{ value: '', label: 'Select Barangay' }, ...(formData.city_municipality ? addressData.barangays[formData.city_municipality] || [] : []).map((b: any) => ({ value: b, label: b }))]}
      />
    </div>
  </div>
);
