import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { PatientFormData } from '../../types/patient';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID *
                </label>
                <Input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g., P001"
                  className="w-full"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter full name"
                  className="w-full"
                />
              </div>

              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age *
                </label>
                <Input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleFormChange}
                  required
                  min="0"
                  placeholder="Enter age"
                  className="w-full"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Civil Status */}
              <div>
                <label htmlFor="civil_status" className="block text-sm font-medium text-gray-700 mb-1">
                  Civil Status *
                </label>
                <select
                  id="civil_status"
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter phone number"
                  className="w-full"
                />
              </div>

              {/* Occupation */}
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation *
                </label>
                <Input
                  type="text"
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter occupation"
                  className="w-full"
                />
              </div>

              {/* Room */}
              <div>
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
                  Room *
                </label>
                <Input
                  type="text"
                  id="room"
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter room number"
                  className="w-full"
                />
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <Input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter department"
                  className="w-full"
                />
              </div>

              {/* Admission Date */}
              <div>
                <label htmlFor="admission_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Date *
                </label>
                <Input
                  type="date"
                  id="admission_date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleFormChange}
                  required
                  className="w-full"
                />
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <Input
                  type="text"
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter condition"
                  className="w-full"
                />
              </div>

              {/* Physician */}
              <div>
                <label htmlFor="physician" className="block text-sm font-medium text-gray-700 mb-1">
                  Physician *
                </label>
                <Input
                  type="text"
                  id="physician"
                  name="physician"
                  value={formData.physician}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter physician name"
                  className="w-full"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* PhilHealth ID */}
              <div>
                <label htmlFor="philhealth_id" className="block text-sm font-medium text-gray-700 mb-1">
                  PhilHealth ID *
                </label>
                <Input
                  type="text"
                  id="philhealth_id"
                  name="philhealth_id"
                  value={formData.philhealth_id}
                  onChange={handleFormChange}
                  required
                  placeholder="Enter PhilHealth ID"
                  className="w-full"
                />
              </div>
            </div>

            {/* Address (Full width) */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                required
                rows={3}
                placeholder="Enter full address"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {formLoading ? 'Creating Patient...' : 'Register Patient'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
