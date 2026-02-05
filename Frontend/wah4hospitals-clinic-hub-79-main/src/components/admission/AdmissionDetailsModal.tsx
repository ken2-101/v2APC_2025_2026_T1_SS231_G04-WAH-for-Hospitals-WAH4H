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
  onDelete?: (id: number) => void;
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

  const initials = admission.patient_summary?.full_name
    ? admission.patient_summary.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'NA';

  const handleEditChange = (field: keyof Admission, value: any) => {
    if (!editData) return;
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
    // ...
  };

  const validateForm = (): boolean => {
    // Simplified validation for now
    return true; 
  };

  const handleUpdate = async () => {
    if (!editData) return;
    setIsLoading(true);
    try {
      const updated = await admissionService.update(editData.encounter_id, editData);
      onUpdate?.(updated);
      setMode('view');
      alert('✅ Admission updated successfully!');
    } catch (err: any) {
      console.error('Update failed:', err);
      // alert('❌ Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setIsLoading(true);
    try {
      await admissionService.delete(admission.encounter_id);
      onDelete?.(admission.encounter_id);
      onClose();
      alert('✅ Admission deleted successfully!');
    } catch (err: any) {
      console.error('Delete failed:', err);
      // alert('❌ Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (DetailCard, DetailItem components usually fine) ...
  // Re-defining for context if needed, but assuming they are helper generic components

  // View Mode Rendering
  const renderViewMode = () => (
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
                  {admission.patient_summary?.full_name || 'Unknown Patient'}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-gray-600">
                    Patient ID: <span className="font-semibold text-gray-900">{admission.patient_summary?.patient_id || 'N/A'}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">
                    Encounter: <span className="font-semibold text-gray-900">{admission.identifier}</span>
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="font-medium">
                    {admission.status}
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    {admission.class_field}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Admission Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">
                {admission.period_start ? new Date(admission.period_start).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      {/* Mapped fields to DTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardContent className="p-5">
             <h4 className="font-semibold mb-4">Medical Information</h4>
             <div className="space-y-2">
               <p><span className="font-medium">Type:</span> {admission.type || 'N/A'}</p>
               <p><span className="font-medium">Service Type:</span> {admission.service_type || 'N/A'}</p>
               <p><span className="font-medium">Reason:</span> {admission.reason_code || 'N/A'}</p>
               <p><span className="font-medium">Admit Source:</span> {admission.admit_source || 'N/A'}</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
             <h4 className="font-semibold mb-4">Tracking</h4>
             <div className="space-y-2">
                <p><span className="font-medium">Location:</span> {admission.location_summary?.name || 'N/A'}</p>
                <p><span className="font-medium">Practitioner:</span> {admission.practitioner_summary?.full_name || 'N/A'}</p>
                <p><span className="font-medium">Discharge Disposition:</span> {admission.discharge_disposition || 'N/A'}</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0">
         <DialogHeader className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
           <div className="flex items-center justify-between">
              <DialogTitle>
                {mode === 'view' ? 'Admission Details' : mode === 'edit' ? 'Edit Admission' : 'Delete Admission'}
              </DialogTitle>
              {mode === 'view' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setMode('edit')}><Edit className="w-4 h-4 mr-1"/> Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => setMode('delete')}><Trash2 className="w-4 h-4 mr-1"/> Delete</Button>
                </div>
              )}
           </div>
         </DialogHeader>

         <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
           {mode === 'view' && renderViewMode()}
           {mode === 'edit' && (
             <div className="text-center py-10 text-gray-500">
               Edit functionality is temporarily disabled pending backend updates.
               <div className="mt-4">
                 <Button variant="outline" onClick={() => setMode('view')}>Back to View</Button>
               </div>
             </div>
           )}
           {mode === 'delete' && (
              <div className="space-y-6">
                 <p className="text-red-600 font-bold">Are you sure you want to delete this admission?</p>
                 <Input 
                   placeholder="Type DELETE to confirm" 
                   value={confirmText} 
                   onChange={e => setConfirmText(e.target.value.toUpperCase())}
                 />
                 <div className="flex justify-end gap-2">
                   <Button variant="outline" onClick={() => setMode('view')}>Cancel</Button>
                   <Button variant="destructive" onClick={handleDelete} disabled={confirmText !== 'DELETE'}>Delete</Button>
                 </div>
              </div>
           )}
         </div>
      </DialogContent>
    </Dialog>
  );
};
