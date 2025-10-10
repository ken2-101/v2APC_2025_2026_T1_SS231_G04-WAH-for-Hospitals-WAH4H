import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Eye, EyeOff, FileText, Search, Filter, X } from 'lucide-react';
import { PatientDetailsModal } from '@/components/patients/PatientDetailsModal';
import { PatientRegistrationModal } from '@/components/patients/PatientRegistrationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

// src/components/PatientForm.jsx
import axios from 'axios';

const PatientRegistration = () => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    age: '',
    gender: '',
    civil_status: '',
    phone: '',
    address: '',
    occupation: '',
    room: '',
    department: '',
    admission_date: '',
    condition: '',
    physician: '',
    status: '',
    philhealth_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // API call to create patient
      const response = await axios.post('http://localhost:8000/api/patients/', formData);
      setSuccess('Patient created successfully!');
      
      // Reset form
      setFormData({
        id: '',
        name: '',
        age: '',
        gender: '',
        civil_status: '',
        phone: '',
        address: '',
        occupation: '',
        room: '',
        department: '',
        admission_date: '',
        condition: '',
        physician: '',
        status: '',
        philhealth_id: ''
      });
    } catch (err) {
      setError(err.response?.data || 'Error creating patient');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New Patient</h2>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID */}
          <div>
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID *
            </label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., P001"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter age"
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
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          {/* Occupation */}
          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
              Occupation *
            </label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter occupation"
            />
          </div>

          {/* Room */}
          <div>
            <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">
              Room *
            </label>
            <input
              type="text"
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room number"
            />
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter department"
            />
          </div>

          {/* Admission Date */}
          <div>
            <label htmlFor="admission_date" className="block text-sm font-medium text-gray-700 mb-1">
              Admission Date *
            </label>
            <input
              type="date"
              id="admission_date"
              name="admission_date"
              value={formData.admission_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Condition */}
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <input
              type="text"
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter condition"
            />
          </div>

          {/* Physician */}
          <div>
            <label htmlFor="physician" className="block text-sm font-medium text-gray-700 mb-1">
              Physician *
            </label>
            <input
              type="text"
              id="physician"
              name="physician"
              value={formData.physician}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter physician name"
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
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <input
              type="text"
              id="philhealth_id"
              name="philhealth_id"
              value={formData.philhealth_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PhilHealth ID"
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
            onChange={handleChange}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full address"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-200`}
          >
            {loading ? 'Creating Patient...' : 'Create Patient'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;