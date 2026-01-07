import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search } from 'lucide-react';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdmit: (data: AdmissionFormData) => void;
  onNavigate?: (tabId: string) => void;
}

interface AdmissionFormData {
  patientId: string;
  patientName: string;
  admissionDate: string;
  admittingDiagnosis: string;
  reasonForAdmission: string;
  ward: string;
  room: string;
  bed: string;
  attendingPhysician: string;
  assignedNurse: string;
  admissionCategory: string;
  modeOfArrival: string;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  isOpen,
  onClose,
  onAdmit,
  onNavigate,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AdmissionFormData>({
    patientId: '',
    patientName: '',
    admissionDate: new Date().toISOString().slice(0, 16),
    admittingDiagnosis: '',
    reasonForAdmission: '',
    ward: '',
    room: '',
    bed: '',
    attendingPhysician: '',
    assignedNurse: '',
    admissionCategory: 'Regular',
    modeOfArrival: 'Walk-in',
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (field: keyof AdmissionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'patientName') {
      if (selectedPatient) {
        setSelectedPatient(null);
        setFormData(prev => ({ ...prev, patientId: '' }));
      }

      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        handleSearchPatient(value);
      }, 300);
    }
  };

  const handleSearchPatient = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const API_URL =
        import.meta.env.BACKEND_PATIENTS_8000 ||
        (import.meta.env.LOCAL_8000 ? `${import.meta.env.LOCAL_8000}/api/patients/` : import.meta.env.BACKEND_PATIENTS);

      const response = await axios.get(
        `${API_URL}?search=${encodeURIComponent(query)}`
      );
      if (Array.isArray(response.data)) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.last_name}, ${patient.first_name}`,
    }));
    setSearchResults([]);
  };

  const handleSubmit = () => {
    if (!formData.patientId) return;
    onAdmit(formData);
    onClose();
    setStep(1);
    setFormData({
      patientId: '',
      patientName: '',
      admissionDate: new Date().toISOString().slice(0, 16),
      admittingDiagnosis: '',
      reasonForAdmission: '',
      ward: '',
      room: '',
      bed: '',
      attendingPhysician: '',
      assignedNurse: '',
      admissionCategory: 'Regular',
      modeOfArrival: 'Walk-in',
    });
    setSelectedPatient(null);
    setSearchResults([]);
  };

  const SelectField: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: string[] }> = ({
    label,
    value,
    onChange,
    options,
  }) => (
    <div>
      <Label>{label}</Label>
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

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Patient Identification</h3>
      {!selectedPatient ? (
        <>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-10"
                value={formData.patientName}
                onChange={e => handleChange('patientName', e.target.value)}
              />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-2">Select a patient:</p>
              {searchResults.map(patient => (
                <div
                  key={patient.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded flex justify-between items-center"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div>
                    <p className="font-medium">{patient.last_name}, {patient.first_name}</p>
                    <p className="text-xs text-gray-500">ID: {patient.patient_id} | DOB: {patient.date_of_birth}</p>
                  </div>
                  <Button size="sm" variant="ghost">Select</Button>
                </div>
              ))}
            </div>
          )}

          {formData.patientName && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No patient found.</p>
              <Button
                variant="outline"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('patients');
                    onClose();
                  } else {
                    window.location.href = '/patients';
                  }
                }}
              >
                Create New Patient Record
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-green-800">Selected Patient</p>
            <p className="text-green-700">{selectedPatient.last_name}, {selectedPatient.first_name}</p>
            <p className="text-sm text-green-600">ID: {selectedPatient.patient_id}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>Change</Button>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Encounter Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Date & Time of Admission</Label>
          <Input
            type="datetime-local"
            value={formData.admissionDate}
            onChange={e => handleChange('admissionDate', e.target.value)}
          />
        </div>
        <div>
          <Label>Encounter Type</Label>
          <Input value="Inpatient" disabled />
        </div>
      </div>
      <div>
        <Label>Admitting Diagnosis (ICD-10)</Label>
        <Input
          placeholder="Search ICD-10 code..."
          value={formData.admittingDiagnosis}
          onChange={e => handleChange('admittingDiagnosis', e.target.value)}
        />
      </div>
      <div>
        <Label>Reason for Admission</Label>
        <Textarea
          placeholder="Enter reason..."
          value={formData.reasonForAdmission}
          onChange={e => handleChange('reasonForAdmission', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Facility & Location</h3>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Ward" value={formData.ward} onChange={val => handleChange('ward', val)} options={['General Ward', 'ICU', 'Pediatrics']} />
        <SelectField label="Room" value={formData.room} onChange={val => handleChange('room', val)} options={['101', '102']} />
        <SelectField label="Bed" value={formData.bed} onChange={val => handleChange('bed', val)} options={['A', 'B']} />
        <div>
          <Label>Attending Physician</Label>
          <Input
            placeholder="Search Physician..."
            value={formData.attendingPhysician}
            onChange={e => handleChange('attendingPhysician', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Administrative Fields</h3>
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Admission Category"
          value={formData.admissionCategory}
          onChange={val => handleChange('admissionCategory', val)}
          options={['Emergency', 'Regular']}
        />
        <SelectField
          label="Mode of Arrival"
          value={formData.modeOfArrival}
          onChange={val => handleChange('modeOfArrival', val)}
          options={['Walk-in', 'Ambulance', 'Referral']}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="admit-patient-description">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
        </DialogHeader>

        <p id="admit-patient-description" className="sr-only">
          Use this dialog to admit a patient, fill out all required details, and navigate through steps.
        </p>

        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={step === 4 ? handleSubmit : () => setStep(step + 1)}
            disabled={step === 1 && !selectedPatient}
          >
            {step === 4 ? 'Admit Patient' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
