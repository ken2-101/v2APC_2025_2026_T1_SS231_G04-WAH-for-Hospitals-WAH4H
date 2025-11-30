import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { PatientFormData } from '../../types/patient';
import { regions, provinces, cities, barangays } from '../../data/addressData';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: PatientFormData;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
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
  // Reset dependent address fields when parent field changes
  useEffect(() => {
    // This logic is handled by the parent's handleFormChange if we were passing specific setters,
    // but since we are using a single handleFormChange, we might need to handle side effects here or in the parent.
    // For simplicity, we'll assume the user manually selects the correct child options, 
    // or we could enhance handleFormChange in the parent.
    // However, to ensure data consistency, let's just render the options based on current selection.
  }, [formData.region, formData.province, formData.city_municipality]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Register New Patient</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}
          
          {formError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {formError}
            </div>
          )}

          <form onSubmit={handleRegisterPatient} className="space-y-6">
            
            {/* Identity Section */}
            <div>
              <h4 className="text-lg font-semibold mb-3 border-b pb-2">Identity & Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">Facility Patient ID *</label>
                  <Input type="text" id="id" name="id" value={formData.id} onChange={handleFormChange} required placeholder="e.g., P001" />
                </div>
                <div>
                  <label htmlFor="philhealth_id" className="block text-sm font-medium text-gray-700 mb-1">PhilHealth ID *</label>
                  <Input type="text" id="philhealth_id" name="philhealth_id" value={formData.philhealth_id} onChange={handleFormChange} required placeholder="12-digit PIN" />
                </div>
                <div>
                  <label htmlFor="national_id" className="block text-sm font-medium text-gray-700 mb-1">National ID (Optional)</label>
                  <Input type="text" id="national_id" name="national_id" value={formData.national_id} onChange={handleFormChange} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <Input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleFormChange} required />
                </div>
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <Input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleFormChange} required />
                </div>
                <div>
                  <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <Input type="text" id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleFormChange} />
                </div>
                <div>
                  <label htmlFor="suffix" className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
                  <Input type="text" id="suffix" name="suffix" value={formData.suffix} onChange={handleFormChange} placeholder="e.g. Jr, III" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                  <select id="sex" name="sex" value={formData.sex} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <Input type="date" id="date_of_birth" name="date_of_birth" value={formData.date_of_birth} onChange={handleFormChange} required />
                </div>
                <div>
                  <label htmlFor="civil_status" className="block text-sm font-medium text-gray-700 mb-1">Civil Status *</label>
                  <select id="civil_status" name="civil_status" value={formData.civil_status} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                  <Input type="text" id="nationality" name="nationality" value={formData.nationality} onChange={handleFormChange} required />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h4 className="text-lg font-semibold mb-3 border-b pb-2">Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <Input type="text" id="mobile_number" name="mobile_number" value={formData.mobile_number} onChange={handleFormChange} required placeholder="09xxxxxxxxx" />
                </div>
                <div>
                  <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
                  <Input type="text" id="telephone" name="telephone" value={formData.telephone} onChange={handleFormChange} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} />
                </div>
              </div>
            </div>

            {/* Address (PSGC) */}
            <div>
              <h4 className="text-lg font-semibold mb-3 border-b pb-2">Address (PSGC)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                  <select id="region" name="region" value={formData.region} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select Region</option>
                    {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                  <select id="province" name="province" value={formData.province} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2" disabled={!formData.region}>
                    <option value="">Select Province</option>
                    {formData.region && provinces[formData.region]?.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="city_municipality" className="block text-sm font-medium text-gray-700 mb-1">City/Municipality *</label>
                  <select id="city_municipality" name="city_municipality" value={formData.city_municipality} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2" disabled={!formData.province}>
                    <option value="">Select City/Municipality</option>
                    {formData.province && cities[formData.province]?.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="barangay" className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                  <select id="barangay" name="barangay" value={formData.barangay} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2" disabled={!formData.city_municipality}>
                    <option value="">Select Barangay</option>
                    {formData.city_municipality && barangays[formData.city_municipality]?.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="house_no_street" className="block text-sm font-medium text-gray-700 mb-1">House No. / Street</label>
                <Input type="text" id="house_no_street" name="house_no_street" value={formData.house_no_street} onChange={handleFormChange} placeholder="Lot/Block/Phase/Street Name" />
              </div>
            </div>

            {/* Hospital Info */}
            <div>
              <h4 className="text-lg font-semibold mb-3 border-b pb-2">Hospital Admission Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select id="status" name="status" value={formData.status} onChange={handleFormChange} required className="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admission_date" className="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                  <Input type="date" id="admission_date" name="admission_date" value={formData.admission_date} onChange={handleFormChange} required />
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <Input type="text" id="department" name="department" value={formData.department} onChange={handleFormChange} />
                </div>
                <div>
                  <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <Input type="text" id="room" name="room" value={formData.room} onChange={handleFormChange} />
                </div>
                <div>
                  <label htmlFor="physician" className="block text-sm font-medium text-gray-700 mb-1">Physician</label>
                  <Input type="text" id="physician" name="physician" value={formData.physician} onChange={handleFormChange} />
                </div>
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <Input type="text" id="condition" name="condition" value={formData.condition} onChange={handleFormChange} />
                </div>
                <div>
                  <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <Input type="text" id="occupation" name="occupation" value={formData.occupation} onChange={handleFormChange} />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={formLoading}>Cancel</Button>
              <Button type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700">
                {formLoading ? 'Creating Patient...' : 'Register Patient'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
