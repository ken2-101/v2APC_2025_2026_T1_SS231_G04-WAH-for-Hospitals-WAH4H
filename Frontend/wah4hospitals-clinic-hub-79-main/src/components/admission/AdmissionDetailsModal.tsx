import React, { useState, ChangeEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { Admission } from '@/types/admission';
import { admissionService } from '@/services/admissionService';

interface AdmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: Admission | null;
  onUpdate?: (updatedAdmission: Admission) => void;
  onDelete?: (id: string) => void;
}

export const AdmissionDetailsModal: React.FC<AdmissionDetailsModalProps> = ({
  isOpen,
  onClose,
  admission,
  onUpdate,
  onDelete,
}) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [editData, setEditData] = useState<Admission | null>(admission);
  const [confirmText, setConfirmText] = useState('');

  // Only reset editData when the admission itself changes
  useEffect(() => {
    setEditData(admission ? { ...admission } : null);
    setMode('view');
    setConfirmText('');
  }, [admission]);

  if (!admission) return null;

  const initials = admission.patient_details
    ? `${admission.patient_details.first_name[0]}${admission.patient_details.last_name[0]}`.toUpperCase()
    : 'NA';

  const handleEditChange = (field: keyof Admission, value: string) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleUpdate = async () => {
    if (!editData) return;
    try {
      const updated = await admissionService.update(Number(editData.id), editData);
      onUpdate?.(updated);
      alert('Admission updated successfully!');
      setMode('view');
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update admission.');
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    try {
      await admissionService.delete(Number(admission.id));
      onDelete?.(admission.id);
      onClose();
      alert('Admission deleted successfully!');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete admission.');
    }
  };

  const DetailCard: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({
    title,
    icon: Icon,
    children,
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold">{title}</h4>
        </div>
        {children}
      </CardContent>
    </Card>
  );

  const DetailItem: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
    <div className="space-y-1 text-sm">
      <span className="text-gray-600 text-xs">{label}:</span>
      <p className="font-medium">{value ?? 'N/A'}</p>
    </div>
  );

  const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {mode === 'view'
                ? 'Admission Details'
                : mode === 'edit'
                ? 'Edit Admission'
                : 'Confirm Deletion'}
            </DialogTitle>
            {mode === 'view' && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setMode('edit')}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setMode('delete')}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {mode === 'view' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">{initials}</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {admission.patient_details
                    ? `${admission.patient_details.last_name}, ${admission.patient_details.first_name}`
                    : 'Unknown Patient'}
                </h3>
                <p className="text-gray-600">Admission ID: {admission.admission_id}</p>
                <Badge className="mt-1">{admission.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailCard title="Patient Info" icon={User}>
                <DetailItem label="Patient ID" value={admission.patient_details?.patient_id} />
                <DetailItem
                  label="Full Name"
                  value={
                    admission.patient_details
                      ? `${admission.patient_details.last_name}, ${admission.patient_details.first_name}`
                      : 'N/A'
                  }
                />
              </DetailCard>

              <DetailCard title="Admission Info" icon={Calendar}>
                <DetailItem label="Admission Date" value={new Date(admission.admission_date).toLocaleString()} />
                <DetailItem label="Encounter Type" value={admission.encounter_type} />
                <DetailItem label="Diagnosis" value={admission.admitting_diagnosis} />
                <DetailItem label="Reason" value={admission.reason_for_admission} />
                <DetailItem label="Assigned Nurse" value={admission.assigned_nurse} />
              </DetailCard>

              <DetailCard title="Location" icon={Briefcase}>
                <DetailItem label="Ward" value={admission.ward} />
                <DetailItem label="Room" value={admission.room} />
                <DetailItem label="Bed" value={admission.bed} />
              </DetailCard>

              <DetailCard title="Staff & Admin" icon={Briefcase}>
                <DetailItem label="Attending Physician" value={admission.attending_physician} />
                <DetailItem label="Category" value={admission.admission_category} />
                <DetailItem label="Mode of Arrival" value={admission.mode_of_arrival} />
                <DetailItem label="Status" value={admission.status} />
              </DetailCard>
            </div>
          </>
        )}

        {mode === 'edit' && editData && (
          <div className="space-y-4 py-2">
            <FormField label="Diagnosis">
              <Input
                value={editData.admitting_diagnosis}
                onChange={e => handleEditChange('admitting_diagnosis', e.target.value)}
              />
            </FormField>
            <FormField label="Reason for Admission">
              <Textarea
                value={editData.reason_for_admission}
                onChange={e => handleEditChange('reason_for_admission', e.target.value)}
              />
            </FormField>
            <FormField label="Assigned Nurse">
              <Input value={editData.assigned_nurse} onChange={e => handleEditChange('assigned_nurse', e.target.value)} />
            </FormField>
            <FormField label="Ward">
              <Select value={editData.ward} onValueChange={val => handleEditChange('ward', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Ward">General Ward</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Room">
              <Input value={editData.room} onChange={e => handleEditChange('room', e.target.value)} />
            </FormField>
            <FormField label="Bed">
              <Input value={editData.bed} onChange={e => handleEditChange('bed', e.target.value)} />
            </FormField>
            <FormField label="Attending Physician">
              <Input value={editData.attending_physician} onChange={e => handleEditChange('attending_physician', e.target.value)} />
            </FormField>

            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setMode('view')}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </div>
        )}

        {mode === 'delete' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-700">
              Type <strong>DELETE</strong> below to confirm deletion of this admission.
            </p>
            <Input
              placeholder="DELETE"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
            />
            <DialogFooter className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => { setConfirmText(''); setMode('view'); }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={confirmText !== 'DELETE'}>
                Delete
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
