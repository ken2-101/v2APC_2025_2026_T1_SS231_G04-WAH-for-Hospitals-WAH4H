import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  onSave,
}) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState<MonitoringData>(
    data || {
      patientId: '',
      patientName: '',
      room: '',
      dateTime: new Date().toISOString().slice(0, 16),
      patientIdentification: { id: '', name: '', age: '', gender: '' },
      vitalSigns: { heartRate: '', bloodPressure: '', temperature: '', respiratoryRate: '' },
      painScore: '',
      intakeOutput: { intake: '', output: '' },
      levelOfConsciousness: '',
      oxygenSaturation: '',
      respiratoryPattern: '',
      ivLineStatus: { status: '', siteCondition: '' },
      medicationIntake: '',
      dietaryIntake: '',
      nursingNotes: '',
      staffSignature: '',
    }
  );

  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
      toast({
        title: "Success",
        description: `Patient monitoring data ${mode === 'add' ? 'added' : 'updated'} successfully.`,
      });
    }
    onClose();
  };

  const updateFormData = (path: string, value: string) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData: any = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const renderInput = (label: string, path: string, type: string = 'text', rows?: number) => (
    <>
      <Label>{label}</Label>
      {rows ? (
        <Textarea
          value={(formData as any)[path.split('.')[0]][path.split('.')[1]]}
          onChange={(e) => updateFormData(path, e.target.value)}
          readOnly={isReadOnly}
          rows={rows}
        />
      ) : (
        <Input
          type={type}
          value={(formData as any)[path.split('.')[0]][path.split('.')[1]] ?? ''}
          onChange={(e) => updateFormData(path, e.target.value)}
          readOnly={isReadOnly}
        />
      )}
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' ? 'View' : mode === 'edit' ? 'Edit' : 'Add'} Patient Monitoring
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Room</Label>
                <Input value={formData.room} onChange={(e) => updateFormData('room', e.target.value)} readOnly={isReadOnly} />
              </div>
              <div>
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={formData.dateTime} onChange={(e) => updateFormData('dateTime', e.target.value)} readOnly={isReadOnly} />
              </div>
              <div>
                <Label>Patient Name</Label>
                <Input value={formData.patientName} onChange={(e) => updateFormData('patientName', e.target.value)} readOnly={isReadOnly} />
              </div>
            </CardContent>
          </Card>

          {/* Patient Identification */}
          <Card>
            <CardHeader><CardTitle>Patient Identification</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderInput('Patient ID', 'patientIdentification.id')}
              {renderInput('Full Name', 'patientIdentification.name')}
              {renderInput('Age', 'patientIdentification.age')}
              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.patientIdentification.gender}
                  onValueChange={(v) => updateFormData('patientIdentification.gender', v)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <Card>
            <CardHeader><CardTitle>Vital Signs</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderInput('Heart Rate (BPM)', 'vitalSigns.heartRate')}
              {renderInput('Blood Pressure', 'vitalSigns.bloodPressure')}
              {renderInput('Temperature (°C)', 'vitalSigns.temperature')}
              {renderInput('Respiratory Rate', 'vitalSigns.respiratoryRate')}
            </CardContent>
          </Card>

          {/* Pain & Consciousness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Pain & Consciousness</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {renderInput('Pain Score (0-10)', 'painScore')}
                <div>
                  <Label>Level of Consciousness</Label>
                  <Select
                    value={formData.levelOfConsciousness}
                    onValueChange={(v) => updateFormData('levelOfConsciousness', v)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
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
              <CardHeader><CardTitle>Respiratory & Oxygen</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {renderInput('Oxygen Saturation (%)', 'oxygenSaturation')}
                {renderInput('Respiratory Pattern', 'respiratoryPattern')}
              </CardContent>
            </Card>
          </div>

          {/* Intake/Output & IV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Intake & Output</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {renderInput('Intake (mL)', 'intakeOutput.intake')}
                {renderInput('Output (mL)', 'intakeOutput.output')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>IV Line Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>IV Status</Label>
                  <Select
                    value={formData.ivLineStatus.status}
                    onValueChange={(v) => updateFormData('ivLineStatus.status', v)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patent">Patent</SelectItem>
                      <SelectItem value="infiltrated">Infiltrated</SelectItem>
                      <SelectItem value="occluded">Occluded</SelectItem>
                      <SelectItem value="none">No IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {renderInput('Site Condition', 'ivLineStatus.siteCondition')}
              </CardContent>
            </Card>
          </div>

          {/* Medication & Diet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInput('Medication Intake', 'medicationIntake', 'text', 3)}
            {renderInput('Dietary Intake', 'dietaryIntake', 'text', 3)}
          </div>

          {/* Notes & Staff */}
          <Card>
            <CardHeader><CardTitle>Nursing Notes & Staff Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {renderInput('Nursing Notes / Remarks', 'nursingNotes', 'text', 4)}
              {renderInput('Staff Name & Signature', 'staffSignature')}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>{mode === 'view' ? 'Close' : 'Cancel'}</Button>
            {mode !== 'view' && <Button onClick={handleSave}>{mode === 'add' ? 'Add' : 'Save Changes'}</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
