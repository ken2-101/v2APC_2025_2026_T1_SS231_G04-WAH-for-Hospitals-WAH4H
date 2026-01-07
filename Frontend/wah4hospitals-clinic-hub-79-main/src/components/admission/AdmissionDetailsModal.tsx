import React, { useState, ChangeEvent, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, User, Briefcase, MapPin, Stethoscope, FileText, X, Save, AlertCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Only reset editData when the admission itself changes
  useEffect(() => {
    setEditData(admission ? { ...admission } : null);
    setMode('view');
    setConfirmText('');
    setErrors({});
    setIsLoading(false);
  }, [admission]);

  if (!admission) return null;

  const initials = admission.patient_details
    ? `${admission.patient_details.first_name[0]}${admission.patient_details.last_name[0]}`.toUpperCase()
    : 'NA';

  const handleEditChange = (field: keyof Admission, value: string) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editData) return false;

    // Required field validations
    if (!editData.admitting_diagnosis?.trim()) {
      newErrors.admitting_diagnosis = 'Diagnosis is required';
    }
    if (!editData.reason_for_admission?.trim()) {
      newErrors.reason_for_admission = 'Reason for admission is required';
    }
    if (!editData.ward?.trim()) {
      newErrors.ward = 'Ward is required';
    }
    if (!editData.room?.trim()) {
      newErrors.room = 'Room is required';
    }
    if (!editData.bed?.trim()) {
      newErrors.bed = 'Bed is required';
    }
    if (!editData.attending_physician?.trim()) {
      newErrors.attending_physician = 'Attending physician is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!editData) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updated = await admissionService.update(Number(editData.id), editData);
      onUpdate?.(updated);
      setMode('view');
      setErrors({});
      // You can replace this with a toast notification library
      alert('✅ Admission updated successfully!');
    } catch (err: any) {
      console.error('Update failed:', err);
      const errorMessage = err?.response?.data?.message || 'Failed to update admission. Please try again.';
      alert('❌ ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    
    setIsLoading(true);
    try {
      await admissionService.delete(Number(admission.id));
      onDelete?.(admission.id);
      onClose();
      alert('✅ Admission deleted successfully!');
    } catch (err: any) {
      console.error('Delete failed:', err);
      const errorMessage = err?.response?.data?.message || 'Failed to delete admission. Please try again.';
      alert('❌ ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const DetailCard: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode; className?: string }> = ({
    title,
    icon: Icon,
    children,
    className = ''
  }) => (
    <Card className={`border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  const DetailItem: React.FC<{ label: string; value: string | null | undefined; icon?: React.FC<any> }> = ({ label, value, icon: Icon }) => (
    <div className="flex justify-between items-start py-1">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold text-right ml-2">{value ?? 'N/A'}</span>
    </div>
  );

  const FormField: React.FC<{ label: string; children: React.ReactNode; error?: string; required?: boolean; description?: string }> = ({ 
    label, 
    children, 
    error, 
    required,
    description 
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500 -mt-1">{description}</p>}
      {children}
      {error && (
        <div className="flex items-center gap-1 text-red-600">
          <AlertCircle className="w-3 h-3" />
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Discharged': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Transferred': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCancelEdit = () => {
    setMode('view');
    setEditData(admission ? { ...admission } : null);
    setErrors({});
  };

  const handleCancelDelete = () => {
    setConfirmText('');
    setMode('view');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                {mode === 'view' ? (
                  <FileText className="w-5 h-5" />
                ) : mode === 'edit' ? (
                  <Edit className="w-5 h-5" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {mode === 'view'
                    ? 'Admission Details'
                    : mode === 'edit'
                    ? 'Edit Admission Record'
                    : 'Delete Admission'}
                </DialogTitle>
                <p className="text-sm text-blue-100 font-normal">
                  {mode === 'view' && `ID: ${admission?.admission_id}`}
                  {mode === 'edit' && 'Update patient admission information'}
                  {mode === 'delete' && 'Permanently remove this record'}
                </p>
              </div>
            </div>
            {mode === 'view' && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setMode('edit')}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setMode('delete')}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-400/30"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
          {mode === 'view' && (
            <div className="space-y-6">
              {/* Patient Header Card */}
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl">{initials}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {admission.patient_details
                            ? `${admission.patient_details.first_name} ${admission.patient_details.last_name}`
                            : 'Unknown Patient'}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-600">
                            Patient ID: <span className="font-semibold text-gray-900">{admission.patient_details?.patient_id || 'N/A'}</span>
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-600">
                            Admission: <span className="font-semibold text-gray-900">{admission.admission_id}</span>
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Badge className={`${getStatusColor(admission.status)} border font-semibold`}>
                            {admission.status}
                          </Badge>
                          <Badge variant="outline" className="font-medium">
                            {admission.admission_category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Admission Date</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">
                        {new Date(admission.admission_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(admission.admission_date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <DetailCard title="Medical Information" icon={Stethoscope}>
                  <DetailItem label="Encounter Type" value={admission.encounter_type} />
                  <DetailItem label="Admitting Diagnosis" value={admission.admitting_diagnosis} />
                  <DetailItem label="Reason for Admission" value={admission.reason_for_admission} />
                  <DetailItem label="Mode of Arrival" value={admission.mode_of_arrival} />
                </DetailCard>

                <DetailCard title="Healthcare Team" icon={User}>
                  <DetailItem label="Attending Physician" value={admission.attending_physician} />
                  <DetailItem label="Assigned Nurse" value={admission.assigned_nurse || 'Not Assigned'} />
                  <DetailItem label="Admission Category" value={admission.admission_category} />
                </DetailCard>

                <DetailCard title="Location Details" icon={MapPin}>
                  <DetailItem label="Ward" value={admission.ward} />
                  <DetailItem label="Room Number" value={admission.room} />
                  <DetailItem label="Bed Number" value={admission.bed} />
                  <DetailItem 
                    label="Full Location" 
                    value={`${admission.ward} - Room ${admission.room}, Bed ${admission.bed}`} 
                  />
                </DetailCard>

                <DetailCard title="Timestamps" icon={Calendar}>
                  <DetailItem 
                    label="Created At" 
                    value={admission.created_at ? new Date(admission.created_at).toLocaleString() : 'N/A'} 
                  />
                  <DetailItem 
                    label="Last Updated" 
                    value={admission.updated_at ? new Date(admission.updated_at).toLocaleString() : 'N/A'} 
                  />
                  <DetailItem label="Current Status" value={admission.status} />
                </DetailCard>
              </div>
            </div>
          )}

          {mode === 'edit' && editData && (
            <div className="space-y-6">
              {/* Medical Information Section */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Medical Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Diagnosis" required error={errors.admitting_diagnosis}>
                    <Input
                      value={editData.admitting_diagnosis}
                      onChange={e => handleEditChange('admitting_diagnosis', e.target.value)}
                      placeholder="e.g., Pneumonia, Type 2 Diabetes"
                      disabled={isLoading}
                      className={`bg-white ${errors.admitting_diagnosis ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    />
                  </FormField>

                  <FormField label="Encounter Type">
                    <Select 
                      value={editData.encounter_type} 
                      onValueChange={val => handleEditChange('encounter_type', val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inpatient">Inpatient</SelectItem>
                        <SelectItem value="Outpatient">Outpatient</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <FormField label="Reason for Admission" required error={errors.reason_for_admission}>
                  <Textarea
                    value={editData.reason_for_admission}
                    onChange={e => handleEditChange('reason_for_admission', e.target.value)}
                    placeholder="Detailed reason for patient admission..."
                    disabled={isLoading}
                    className={`bg-white resize-none ${errors.reason_for_admission ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    rows={3}
                  />
                </FormField>
              </div>

              {/* Healthcare Team Section */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Healthcare Team</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Attending Physician" required error={errors.attending_physician}>
                    <Input 
                      value={editData.attending_physician} 
                      onChange={e => handleEditChange('attending_physician', e.target.value)}
                      placeholder="Dr. John Smith"
                      disabled={isLoading}
                      className={`bg-white ${errors.attending_physician ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    />
                  </FormField>

                  <FormField label="Assigned Nurse" description="Optional - can be assigned later">
                    <Input 
                      value={editData.assigned_nurse} 
                      onChange={e => handleEditChange('assigned_nurse', e.target.value)}
                      placeholder="Nurse Mary Johnson"
                      disabled={isLoading}
                      className="bg-white focus:border-blue-500"
                    />
                  </FormField>
                </div>
              </div>

              {/* Location Details Section */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Location Assignment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Ward" required error={errors.ward}>
                    <Select 
                      value={editData.ward} 
                      onValueChange={val => handleEditChange('ward', val)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`bg-white ${errors.ward ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Ward">General Ward</SelectItem>
                        <SelectItem value="ICU">ICU</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                        <SelectItem value="Maternity">Maternity</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Room" required error={errors.room}>
                    <Input 
                      value={editData.room} 
                      onChange={e => handleEditChange('room', e.target.value)}
                      placeholder="101"
                      disabled={isLoading}
                      className={`bg-white ${errors.room ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    />
                  </FormField>

                  <FormField label="Bed" required error={errors.bed}>
                    <Input 
                      value={editData.bed} 
                      onChange={e => handleEditChange('bed', e.target.value)}
                      placeholder="A1"
                      disabled={isLoading}
                      className={`bg-white ${errors.bed ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    />
                  </FormField>
                </div>
              </div>

              {/* Administrative Details Section */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Administrative Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Status">
                    <Select 
                      value={editData.status} 
                      onValueChange={val => handleEditChange('status', val as any)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Discharged">Discharged</SelectItem>
                        <SelectItem value="Transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Admission Category">
                    <Select 
                      value={editData.admission_category} 
                      onValueChange={val => handleEditChange('admission_category', val as any)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Mode of Arrival">
                    <Select 
                      value={editData.mode_of_arrival} 
                      onValueChange={val => handleEditChange('mode_of_arrival', val as any)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Ambulance">Ambulance</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </div>

              {/* Error Summary */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-semibold mb-2">Please correct the following errors:</p>
                    <ul className="space-y-1">
                      {Object.values(errors).map((error, idx) => (
                        <li key={idx} className="text-xs text-red-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit} 
                  disabled={isLoading}
                  className="px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={isLoading}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {mode === 'delete' && (
            <div className="space-y-6">
              {/* Warning Banner */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Permanent Deletion Warning</h3>
                    <p className="text-sm text-red-800 mb-3">
                      This action <strong>cannot be undone</strong>. All data associated with this admission will be permanently removed from the system.
                    </p>
                    <div className="bg-white/50 rounded-md p-3 border border-red-200">
                      <p className="text-sm text-gray-700">
                        <strong>Patient:</strong> {admission.patient_details ? `${admission.patient_details.first_name} ${admission.patient_details.last_name}` : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Admission ID:</strong> {admission.admission_id}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Date:</strong> {new Date(admission.admission_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <p className="text-sm font-semibold text-gray-700">Confirmation Required</p>
                  <div className="flex-1 h-0.5 bg-gray-300"></div>
                </div>
                <p className="text-sm text-gray-600">
                  To confirm deletion, type <code className="px-2 py-1 bg-gray-100 rounded text-red-600 font-mono font-bold">DELETE</code> in the box below:
                </p>
                <Input
                  placeholder="Type DELETE to confirm"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="font-mono text-center text-lg font-bold focus:border-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={handleCancelDelete} 
                  disabled={isLoading}
                  className="px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={confirmText !== 'DELETE' || isLoading}
                  className="px-6 bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
