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
              <InputField label="Mobile Number *" name="mobile_number" value={formData.mobile_number} onChange={handleFormChange} required placeholder="09123456789" />
              <InputField label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleFormChange} />
              <InputField label="Suffix" name="suffix_name" value={formData.suffix_name} onChange={handleFormChange} placeholder="e.g., Jr, III" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <SelectField label="Sex *" name="gender" value={formData.gender} onChange={handleFormChange} required options={[
                { value: '', label: 'Select' },
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' }
              ]} />
              <InputField label="Date of Birth *" type="date" name="birthdate" value={formData.birthdate} onChange={handleFormChange} required />
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
        name="address_state" 
        value={formData.address_state}
        onChange={handleFormChange}
        required
        options={[{ value: '', label: 'Select Region' }, ...addressData.regions.map((r: any) => ({ value: r.code, label: r.name }))]}
      />
      <SelectField
        label="Province *"
        name="address_district" 
        value={formData.address_district}
        onChange={handleFormChange}
        required
        disabled={!formData.address_state}
        options={[{ value: '', label: 'Select Province' }, ...(formData.address_state ? addressData.provinces[formData.address_state]?.map((p: any) => ({ value: p.code, label: p.name })) || [] : [])]}
      />
      <SelectField
        label="City/Municipality *"
        name="address_city"
        value={formData.address_city}
        onChange={handleFormChange}
        required
        disabled={!formData.address_district}
        options={[{ value: '', label: 'Select City/Municipality' }, ...(formData.address_district ? addressData.cities[formData.address_district]?.map((c: any) => ({ value: c.code, label: c.name })) || [] : [])]}
      />
      <SelectField
        label="Barangay *"
        name="address_line" // Mapping barangay to address_line for now as per simple schema
        value={formData.address_line}
        onChange={handleFormChange}
        required
        disabled={!formData.address_city}
        options={[{ value: '', label: 'Select Barangay' }, ...(formData.address_city ? addressData.barangays[formData.address_city] || [] : []).map((b: any) => ({ value: b, label: b }))]}
      />
    </div>
  </div>
);
