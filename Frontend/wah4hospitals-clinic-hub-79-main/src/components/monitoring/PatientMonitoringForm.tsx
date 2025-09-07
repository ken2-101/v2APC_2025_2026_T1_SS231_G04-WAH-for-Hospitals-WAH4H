
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface MonitoringData {
  id?: string;
  patientId: string;
  patientName: string;
  room: string;
  dateTime: string;
  patientIdentification: {
    id: string;
    name: string;
    age: string;
    gender: string;
  };
  vitalSigns: {
    heartRate: string;
    bloodPressure: string;
    temperature: string;
    respiratoryRate: string;
  };
  painScore: string;
  intakeOutput: {
    intake: string;
    output: string;
  };
  levelOfConsciousness: string;
  oxygenSaturation: string;
  respiratoryPattern: string;
  ivLineStatus: {
    status: string;
    siteCondition: string;
  };
  medicationIntake: string;
  dietaryIntake: string;
  nursingNotes: string;
  staffSignature: string;
}

interface PatientMonitoringFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'add';
  data?: MonitoringData;
  onSave?: (data: MonitoringData) => void;
}

export const PatientMonitoringForm: React.FC<PatientMonitoringFormProps> = ({
  isOpen,
  onClose,
  mode,
  data,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MonitoringData>(data || {
    patientId: '',
    patientName: '',
    room: '',
    dateTime: new Date().toISOString().slice(0, 16),
    patientIdentification: {
      id: '',
      name: '',
      age: '',
      gender: ''
    },
    vitalSigns: {
      heartRate: '',
      bloodPressure: '',
      temperature: '',
      respiratoryRate: ''
    },
    painScore: '',
    intakeOutput: {
      intake: '',
      output: ''
    },
    levelOfConsciousness: '',
    oxygenSaturation: '',
    respiratoryPattern: '',
    ivLineStatus: {
      status: '',
      siteCondition: ''
    },
    medicationIntake: '',
    dietaryIntake: '',
    nursingNotes: '',
    staffSignature: ''
  });

  const isReadOnly = mode === 'view';

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
      toast({
        title: "Success",
        description: `Patient monitoring data ${mode === 'add' ? 'added' : 'updated'} successfully.`
      });
    }
    onClose();
  };

  const updateFormData = (path: string, value: string) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      return newData;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' && 'View Patient Monitoring'}
            {mode === 'edit' && 'Edit Patient Monitoring'}
            {mode === 'add' && 'Add Patient Monitoring'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => updateFormData('room', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="dateTime">Date and Time</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) => updateFormData('dateTime', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => updateFormData('patientName', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Identification */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Identification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    value={formData.patientIdentification.id}
                    onChange={(e) => updateFormData('patientIdentification.id', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="patientFullName">Full Name</Label>
                  <Input
                    id="patientFullName"
                    value={formData.patientIdentification.name}
                    onChange={(e) => updateFormData('patientIdentification.name', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={formData.patientIdentification.age}
                    onChange={(e) => updateFormData('patientIdentification.age', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.patientIdentification.gender}
                    onValueChange={(value) => updateFormData('patientIdentification.gender', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle>Vital Signs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="heartRate">Heart Rate (BPM)</Label>
                  <Input
                    id="heartRate"
                    value={formData.vitalSigns.heartRate}
                    onChange={(e) => updateFormData('vitalSigns.heartRate', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="bloodPressure">Blood Pressure</Label>
                  <Input
                    id="bloodPressure"
                    value={formData.vitalSigns.bloodPressure}
                    onChange={(e) => updateFormData('vitalSigns.bloodPressure', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    value={formData.vitalSigns.temperature}
                    onChange={(e) => updateFormData('vitalSigns.temperature', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="respiratoryRate">Respiratory Rate</Label>
                  <Input
                    id="respiratoryRate"
                    value={formData.vitalSigns.respiratoryRate}
                    onChange={(e) => updateFormData('vitalSigns.respiratoryRate', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Monitoring Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pain & Consciousness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="painScore">Pain Score (0-10)</Label>
                  <Input
                    id="painScore"
                    value={formData.painScore}
                    onChange={(e) => updateFormData('painScore', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="consciousness">Level of Consciousness</Label>
                  <Select
                    value={formData.levelOfConsciousness}
                    onValueChange={(value) => updateFormData('levelOfConsciousness', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="drowsy">Drowsy</SelectItem>
                      <SelectItem value="confused">Confused</SelectItem>
                      <SelectItem value="unconscious">Unconscious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Respiratory & Oxygen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="oxygenSat">Oxygen Saturation (%)</Label>
                  <Input
                    id="oxygenSat"
                    value={formData.oxygenSaturation}
                    onChange={(e) => updateFormData('oxygenSaturation', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="respPattern">Respiratory Pattern</Label>
                  <Input
                    id="respPattern"
                    value={formData.respiratoryPattern}
                    onChange={(e) => updateFormData('respiratoryPattern', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intake/Output & IV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Intake & Output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="intake">Intake (mL)</Label>
                  <Input
                    id="intake"
                    value={formData.intakeOutput.intake}
                    onChange={(e) => updateFormData('intakeOutput.intake', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
                <div>
                  <Label htmlFor="output">Output (mL)</Label>
                  <Input
                    id="output"
                    value={formData.intakeOutput.output}
                    onChange={(e) => updateFormData('intakeOutput.output', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IV Line Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ivStatus">IV Status</Label>
                  <Select
                    value={formData.ivLineStatus.status}
                    onValueChange={(value) => updateFormData('ivLineStatus.status', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patent">Patent</SelectItem>
                      <SelectItem value="infiltrated">Infiltrated</SelectItem>
                      <SelectItem value="occluded">Occluded</SelectItem>
                      <SelectItem value="none">No IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="siteCondition">Site Condition</Label>
                  <Input
                    id="siteCondition"
                    value={formData.ivLineStatus.siteCondition}
                    onChange={(e) => updateFormData('ivLineStatus.siteCondition', e.target.value)}
                    readOnly={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medication & Diet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="medication">Medication Intake</Label>
              <Textarea
                id="medication"
                value={formData.medicationIntake}
                onChange={(e) => updateFormData('medicationIntake', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="diet">Dietary Intake</Label>
              <Textarea
                id="diet"
                value={formData.dietaryIntake}
                onChange={(e) => updateFormData('dietaryIntake', e.target.value)}
                readOnly={isReadOnly}
                rows={3}
              />
            </div>
          </div>

          {/* Notes & Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Nursing Notes & Staff Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Nursing Notes / Remarks</Label>
                <Textarea
                  id="notes"
                  value={formData.nursingNotes}
                  onChange={(e) => updateFormData('nursingNotes', e.target.value)}
                  readOnly={isReadOnly}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="signature">Name and Signature of Staff</Label>
                <Input
                  id="signature"
                  value={formData.staffSignature}
                  onChange={(e) => updateFormData('staffSignature', e.target.value)}
                  readOnly={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button onClick={handleSave}>
                {mode === 'add' ? 'Add' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
