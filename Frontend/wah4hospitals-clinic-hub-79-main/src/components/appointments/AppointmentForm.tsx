
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AppointmentData {
  id?: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  reason: string;
  notes: string;
  contactNumber: string;
  department: string;
}

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'view' | 'edit' | 'add';
  data?: AppointmentData;
  onSave?: (data: AppointmentData) => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  isOpen,
  onClose,
  mode,
  data,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AppointmentData>({
    patientName: '',
    patientId: '',
    doctorName: '',
    date: '',
    time: '',
    type: '',
    status: 'pending',
    reason: '',
    notes: '',
    contactNumber: '',
    department: ''
  });

  useEffect(() => {
    if (data && isOpen) {
      setFormData(data);
    } else if (!data && isOpen) {
      setFormData({
        patientName: '',
        patientId: '',
        doctorName: '',
        date: '',
        time: '',
        type: '',
        status: 'pending',
        reason: '',
        notes: '',
        contactNumber: '',
        department: ''
      });
    }
  }, [data, isOpen]);

  const isReadOnly = mode === 'view';

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
      toast({
        title: "Success",
        description: `Appointment ${mode === 'add' ? 'created' : 'updated'} successfully.`
      });
    }
    onClose();
  };

  const updateFormData = (field: keyof AppointmentData, value: string) => {
    if (!isReadOnly) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'view' && 'View Appointment'}
            {mode === 'edit' && 'Edit Appointment'}
            {mode === 'add' && 'New Appointment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => updateFormData('patientName', e.target.value)}
                    readOnly={isReadOnly}
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    value={formData.patientId}
                    onChange={(e) => updateFormData('patientId', e.target.value)}
                    readOnly={isReadOnly}
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={formData.contactNumber}
                  onChange={(e) => updateFormData('contactNumber', e.target.value)}
                  readOnly={isReadOnly}
                  className={isReadOnly ? 'bg-gray-50' : ''}
                />
              </div>

              {/* Appointment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctorName">Doctor</Label>
                  {isReadOnly ? (
                    <Input
                      value={formData.doctorName}
                      readOnly
                      className="bg-gray-50"
                    />
                  ) : (
                    <Select
                      value={formData.doctorName}
                      onValueChange={(value) => updateFormData('doctorName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Maria Santos">Dr. Maria Santos</SelectItem>
                        <SelectItem value="Dr. Jose Garcia">Dr. Jose Garcia</SelectItem>
                        <SelectItem value="Dr. Ana Reyes">Dr. Ana Reyes</SelectItem>
                        <SelectItem value="Dr. Luis Rodriguez">Dr. Luis Rodriguez</SelectItem>
                        <SelectItem value="Dr. Carmen Lopez">Dr. Carmen Lopez</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  {isReadOnly ? (
                    <Input
                      value={formData.department}
                      readOnly
                      className="bg-gray-50"
                    />
                  ) : (
                    <Select
                      value={formData.department}
                      onValueChange={(value) => updateFormData('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                        <SelectItem value="General Medicine">General Medicine</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData('date', e.target.value)}
                    readOnly={isReadOnly}
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateFormData('time', e.target.value)}
                    readOnly={isReadOnly}
                    className={isReadOnly ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Appointment Type</Label>
                  {isReadOnly ? (
                    <Input
                      value={formData.type}
                      readOnly
                      className="bg-gray-50"
                    />
                  ) : (
                    <Select
                      value={formData.type}
                      onValueChange={(value) => updateFormData('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consultation">Consultation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Routine Check">Routine Check</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                {isReadOnly ? (
                  <Input
                    value={formData.status}
                    readOnly
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormData('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="reason">Reason for Visit</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => updateFormData('reason', e.target.value)}
                  readOnly={isReadOnly}
                  className={isReadOnly ? 'bg-gray-50' : ''}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  readOnly={isReadOnly}
                  className={isReadOnly ? 'bg-gray-50' : ''}
                  rows={3}
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
                {mode === 'add' ? 'Create Appointment' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
