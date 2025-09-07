
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: any) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister
}) => {
  const [newPatient, setNewPatient] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    contactNumber: '',
    email: '',
    completeAddress: '',
    // Medical Information
    philhealthMember: '',
    philhealthId: '',
    reasonForVisit: '',
    medicalConditions: [],
    knownAllergies: ''
  });

  const handleMedicalConditionChange = (condition: string, checked: boolean) => {
    setNewPatient(prev => ({
      ...prev,
      medicalConditions: checked
        ? [...prev.medicalConditions, condition]
        : prev.medicalConditions.filter(c => c !== condition)
    }));
  };

  const handleRegisterPatient = () => {
    if (!newPatient.firstName || !newPatient.lastName || !newPatient.birthDate || !newPatient.gender) {
      alert('Please fill in all required fields');
      return;
    }

    onRegister(newPatient);
    
    // Reset form
    setNewPatient({
      firstName: '',
      lastName: '',
      birthDate: '',
      gender: '',
      contactNumber: '',
      email: '',
      completeAddress: '',
      philhealthMember: '',
      philhealthId: '',
      reasonForVisit: '',
      medicalConditions: [],
      knownAllergies: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Patient Registration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date (mm/dd/yyyy) *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={newPatient.birthDate}
                  onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label>Gender *</Label>
                <RadioGroup
                  value={newPatient.gender}
                  onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={newPatient.contactNumber}
                  onChange={(e) => setNewPatient({ ...newPatient, contactNumber: e.target.value })}
                  placeholder="+63 XXX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completeAddress">Complete Address</Label>
                <Textarea
                  id="completeAddress"
                  value={newPatient.completeAddress}
                  onChange={(e) => setNewPatient({ ...newPatient, completeAddress: e.target.value })}
                  placeholder="House No., Street, Barangay, City, Province"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>PhilHealth Member?</Label>
                <RadioGroup
                  value={newPatient.philhealthMember}
                  onValueChange={(value) => setNewPatient({ ...newPatient, philhealthMember: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="phil-yes" />
                    <Label htmlFor="phil-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="phil-no" />
                    <Label htmlFor="phil-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {newPatient.philhealthMember === 'Yes' && (
                <div className="space-y-2">
                  <Label htmlFor="philhealthId">PhilHealth ID Number</Label>
                  <Input
                    id="philhealthId"
                    value={newPatient.philhealthId}
                    onChange={(e) => setNewPatient({ ...newPatient, philhealthId: e.target.value })}
                    placeholder="PH-000000000000"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reasonForVisit">Reason for Visit</Label>
                <Select
                  value={newPatient.reasonForVisit}
                  onValueChange={(value) => setNewPatient({ ...newPatient, reasonForVisit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine-checkup">Routine Checkup</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Existing Medical Conditions</Label>
                <div className="space-y-2">
                  {['Diabetes', 'Hypertension', 'Asthma', 'Cancer', 'Heart Disease', 'Other'].map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={condition}
                        checked={newPatient.medicalConditions.includes(condition)}
                        onCheckedChange={(checked) => handleMedicalConditionChange(condition, !!checked)}
                      />
                      <Label htmlFor={condition}>{condition}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="knownAllergies">Known Allergies</Label>
                <Textarea
                  id="knownAllergies"
                  value={newPatient.knownAllergies}
                  onChange={(e) => setNewPatient({ ...newPatient, knownAllergies: e.target.value })}
                  placeholder="List any known allergies..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleRegisterPatient}>
              Register Patient
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
