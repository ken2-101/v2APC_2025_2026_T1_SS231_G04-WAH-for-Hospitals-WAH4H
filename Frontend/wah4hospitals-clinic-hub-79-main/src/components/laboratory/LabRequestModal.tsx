import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, X } from 'lucide-react';
import { LabTestType, LabPriority } from '../../types/laboratory';

interface LabRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export const LabRequestModal: React.FC<LabRequestModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        doctorName: '',
        testType: 'CBC' as LabTestType,
        clinicalReason: '',
        priority: 'Routine' as LabPriority,
        patientId: '',
        patientName: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            dateRequested: new Date().toISOString(),
            status: 'Pending',
            id: `LR-${Math.floor(Math.random() * 10000)}` // Mock ID
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-bold">New Laboratory Request</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Patient ID *</label>
                            <Input
                                required
                                value={formData.patientId}
                                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                                placeholder="P-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Patient Name *</label>
                            <Input
                                required
                                value={formData.patientName}
                                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                                placeholder="Juan Dela Cruz"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Requesting Doctor *</label>
                        <Input
                            required
                            value={formData.doctorName}
                            onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
                            placeholder="Dr. Smith"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Test Type *</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={formData.testType}
                                onChange={e => setFormData({ ...formData, testType: e.target.value as LabTestType })}
                            >
                                <option value="CBC">Complete Blood Count (CBC)</option>
                                <option value="Urinalysis">Urinalysis</option>
                                <option value="Fecalysis">Fecalysis</option>
                                <option value="X-Ray">X-Ray</option>
                                <option value="Ultrasound">Ultrasound</option>
                                <option value="ECG">ECG</option>
                                <option value="Blood Chemistry">Blood Chemistry</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as LabPriority })}
                            >
                                <option value="Routine">Routine</option>
                                <option value="STAT">STAT (Emergency)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Clinical Reason / Diagnosis</label>
                        <Textarea
                            value={formData.clinicalReason}
                            onChange={e => setFormData({ ...formData, clinicalReason: e.target.value })}
                            placeholder="E.g. Fever for 3 days, Rule out Dengue"
                        />
                    </div>

                    {formData.priority === 'STAT' && (
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
