import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, X } from 'lucide-react';
import { LabTestType, LabPriority, LabRequestFormData } from '../../types/laboratory';
import { admissionService } from '../../services/admissionService';
import type { Admission } from '@/types/admission';

interface LabRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: LabRequestFormData) => void;
}

export const LabRequestModal: React.FC<LabRequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [loadingAdmissions, setLoadingAdmissions] = useState(false);
    const [formData, setFormData] = useState({
        admission: '',
        requesting_doctor: '',
        test_type: 'cbc' as LabTestType,
        clinical_reason: '',
        priority: 'routine' as LabPriority,
    });

    useEffect(() => {
        if (isOpen) {
            fetchAdmissions();
        }
    }, [isOpen]);

    const fetchAdmissions = async () => {
        try {
            setLoadingAdmissions(true);
            const data = await admissionService.getAll();
            // Filter only active admissions
            const activeAdmissions = data.filter(a => a.status === 'Active');
            setAdmissions(activeAdmissions);
        } catch (error) {
            console.error('Error fetching admissions:', error);
        } finally {
            setLoadingAdmissions(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Convert admission to number for backend
        const requestData = {
            admission: parseInt(formData.admission),
            requesting_doctor: parseInt(formData.requesting_doctor) || 1, // Default to 1 for MVP
            test_type: formData.test_type,
            priority: formData.priority,
            clinical_reason: formData.clinical_reason
        };

        onSubmit(requestData);
        onClose();
        
        // Reset form
        setFormData({
            admission: '',
            requesting_doctor: '',
            test_type: 'cbc',
            clinical_reason: '',
            priority: 'routine',
        });
    };

    const selectedAdmission = admissions.find(a => a.id?.toString() === formData.admission);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-bold">New Laboratory Request</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Patient (Admission) *</label>
                        {loadingAdmissions ? (
                            <div className="text-sm text-gray-500">Loading admissions...</div>
                        ) : (
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={formData.admission}
                                onChange={e => setFormData({ ...formData, admission: e.target.value })}
                                required
                            >
                                <option value="">-- Select an admitted patient --</option>
                                {admissions.map(admission => (
                                    <option key={admission.id} value={admission.id}>
                                        {admission.admission_id} - Ward: {admission.ward}, Room: {admission.room}, Bed: {admission.bed}
                                    </option>
                                ))}
                            </select>
                        )}
                        {selectedAdmission && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-600">
                                <div><strong>Patient ID:</strong> {selectedAdmission.patient}</div>
                                <div><strong>Location:</strong> Ward {selectedAdmission.ward}, Room {selectedAdmission.room}, Bed {selectedAdmission.bed}</div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Requesting Doctor ID</label>
                        <Input
                            type="number"
                            value={formData.requesting_doctor}
                            onChange={e => setFormData({ ...formData, requesting_doctor: e.target.value })}
                            placeholder="1 (Default)"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter doctor user ID (defaults to 1 for MVP)</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Test Type *</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={formData.test_type}
                                onChange={e => setFormData({ ...formData, test_type: e.target.value as LabTestType })}
                            >
                                <option value="cbc">Complete Blood Count (CBC)</option>
                                <option value="urinalysis">Urinalysis</option>
                                <option value="fecalysis">Fecalysis</option>
                                <option value="xray">X-Ray</option>
                                <option value="ultrasound">Ultrasound</option>
                                <option value="ecg">ECG</option>
                                <option value="blood_chemistry">Blood Chemistry</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as LabPriority })}
                            >
                                <option value="routine">Routine</option>
                                <option value="stat">STAT (Emergency)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Clinical Reason / Diagnosis</label>
                        <Textarea
                            value={formData.clinical_reason}
                            onChange={e => setFormData({ ...formData, clinical_reason: e.target.value })}
                            placeholder="E.g. Fever for 3 days, Rule out Dengue"
                        />
                    </div>

                    {formData.priority === 'stat' && (
                        <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            <span className="text-sm font-medium">STAT requests require immediate attention.</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Submit Request</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
