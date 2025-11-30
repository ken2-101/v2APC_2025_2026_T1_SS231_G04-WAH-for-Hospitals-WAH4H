import React, { useState } from 'react';
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
  onAdmit: (data: any) => void;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({ isOpen, onClose, onAdmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onAdmit(formData);
    onClose();
    setStep(1); // Reset step
  };

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handleSearchPatient = async () => {
    if (!formData.patientName) return;
    setIsSearching(true);
    try {
      // Search by name or ID
      const response = await axios.get(`http://localhost:8000/api/patients/?search=${formData.patientName}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching patient:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.last_name}, ${patient.first_name}`
    }));
    setSearchResults([]); // Clear results after selection
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Patient Identification</h3>
      
      {!selectedPatient ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Search Patient</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search by name or ID..." 
                    className="pl-10"
                    value={formData.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                  />
                </div>
                <Button onClick={handleSearchPatient} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>

          {/* Search Results */}
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
                    <p className="text-xs text-gray-500">ID: {patient.id} | DOB: {patient.date_of_birth}</p>
                  </div>
                  <Button size="sm" variant="ghost">Select</Button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && formData.patientName && !isSearching && (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-2">No patient found.</p>
              <Button variant="outline" onClick={() => window.location.href = '/patient-registration'}>
                Create New Patient Record
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-green-800">Selected Patient</p>
            <p className="text-green-700">{selectedPatient.last_name}, {selectedPatient.first_name}</p>
            <p className="text-sm text-green-600">ID: {selectedPatient.id}</p>
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
            onChange={(e) => handleChange('admissionDate', e.target.value)}
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
          onChange={(e) => handleChange('admittingDiagnosis', e.target.value)}
        />
      </div>
      <div>
        <Label>Reason for Admission</Label>
        <Textarea 
          placeholder="Enter reason..." 
          value={formData.reasonForAdmission}
          onChange={(e) => handleChange('reasonForAdmission', e.target.value)}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Facility & Location</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ward</Label>
          <Select value={formData.ward} onValueChange={(val) => handleChange('ward', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Ward" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General Ward">General Ward</SelectItem>
              <SelectItem value="ICU">ICU</SelectItem>
              <SelectItem value="Pediatrics">Pediatrics</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Room</Label>
          <Select value={formData.room} onValueChange={(val) => handleChange('room', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="101">Room 101 (2/4)</SelectItem>
              <SelectItem value="102">Room 102 (1/4)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Bed</Label>
          <Select value={formData.bed} onValueChange={(val) => handleChange('bed', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Bed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Bed A</SelectItem>
              <SelectItem value="B">Bed B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Attending Physician</Label>
          <Input 
            placeholder="Search Physician..." 
            value={formData.attendingPhysician}
            onChange={(e) => handleChange('attendingPhysician', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Administrative Fields</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Admission Category</Label>
          <Select value={formData.admissionCategory} onValueChange={(val) => handleChange('admissionCategory', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mode of Arrival</Label>
          <Select value={formData.modeOfArrival} onValueChange={(val) => handleChange('modeOfArrival', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Walk-in">Walk-in</SelectItem>
              <SelectItem value="Ambulance">Ambulance</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Admit Patient</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={step === 4 ? handleSubmit : () => setStep(step + 1)}>
            {step === 4 ? 'Admit Patient' : 'Next'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
