import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import { LabRequest, TestParameterFormData, LabResultFormData, LabInterpretation } from '../../types/laboratory';
import { getTestParameters, calculateInterpretation } from './labTestParameters';

interface LabResultEncodingModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: LabRequest | null;
    onSubmit: (requestId: number, data: LabResultFormData) => void;
}

export const LabResultEncodingModal: React.FC<LabResultEncodingModalProps> = ({ isOpen, onClose, request, onSubmit }) => {
    const [parameters, setParameters] = useState<TestParameterFormData[]>([
        { parameter_name: '', result_value: '', unit: '', reference_range: '', interpretation: '' }
    ]);
    const [parameterMetadata, setParameterMetadata] = useState<Map<number, { normalMin?: number; normalMax?: number }>>(new Map());
    const [medTech, setMedTech] = useState('');
    const [prcNumber, setPrcNumber] = useState('');
    const [overallRemarks, setOverallRemarks] = useState('');

    // Load predefined parameters when modal opens or request changes
    useEffect(() => {
        if (isOpen && request) {
            const templates = getTestParameters(request.test_type);
            if (templates.length > 0) {
                const initialParameters = templates.map(template => ({
                    parameter_name: template.parameter_name,
                    result_value: '',
                    unit: template.unit,
                    reference_range: template.reference_range,
                    interpretation: '' as LabInterpretation
                }));
                setParameters(initialParameters);
                
                // Store metadata for auto-calculation
                const metadata = new Map();
                templates.forEach((template, index) => {
                    metadata.set(index, {
                        normalMin: template.normalMin,
                        normalMax: template.normalMax
                    });
                });
                setParameterMetadata(metadata);
            }
        }
    }, [isOpen, request]);

    if (!isOpen || !request) return null;

    const handleAddRow = () => {
        // Add a blank row for custom parameters
        setParameters([...parameters, { parameter_name: '', result_value: '', unit: '', reference_range: '', interpretation: '' }]);
        // Custom parameters don't have metadata for auto-calculation
        const newMetadata = new Map(parameterMetadata);
        newMetadata.set(parameters.length, { normalMin: undefined, normalMax: undefined });
        setParameterMetadata(newMetadata);
    };

    const handleRemoveRow = (index: number) => {
        if (parameters.length > 1) {
            const newParameters = [...parameters];
            newParameters.splice(index, 1);
            setParameters(newParameters);
        }
    };

    const updateRow = (index: number, field: keyof TestParameterFormData, value: string) => {
        const newParameters = [...parameters];
        newParameters[index] = { ...newParameters[index], [field]: value };
        
        // Auto-calculate interpretation when result_value changes
        if (field === 'result_value') {
            const metadata = parameterMetadata.get(index);
            if (metadata) {
                const interpretation = calculateInterpretation(
                    value,
                    metadata.normalMin,
                    metadata.normalMax
                );
                newParameters[index].interpretation = interpretation;
            }
        }
        
        setParameters(newParameters);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const resultData: LabResultFormData = {
            lab_request: request.id,
            medical_technologist: medTech,
            prc_number: prcNumber,
            remarks: overallRemarks,
            // performed_by is optional - don't send it for now (MVP)
            parameters: parameters
        };

        onSubmit(request.id, resultData);
        
        // Reset form - reload predefined parameters
        const templates = getTestParameters(request.test_type);
        if (templates.length > 0) {
            const resetParameters = templates.map(template => ({
                parameter_name: template.parameter_name,
                result_value: '',
                unit: template.unit,
                reference_range: template.reference_range,
                interpretation: '' as LabInterpretation
            }));
            setParameters(resetParameters);
            
            // Reset metadata
            const metadata = new Map();
            templates.forEach((template, index) => {
                metadata.set(index, {
                    normalMin: template.normalMin,
                    normalMax: template.normalMax
                });
            });
            setParameterMetadata(metadata);
        }
        setMedTech('');
        setPrcNumber('');
        setOverallRemarks('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Encode Lab Results</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">Request ID: {request.request_id}</span>
                            <Badge variant="secondary">{request.test_type_display}</Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-md grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 block">Patient</span>
                            <span className="font-medium">{request.patient_name}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Doctor</span>
                            <span className="font-medium">{request.doctor_name || 'N/A'}</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium">Test Results</h3>
                            <Button type="button" size="sm" variant="outline" onClick={handleAddRow}>
                                <Plus className="w-4 h-4 mr-1" /> Add Custom Parameter
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {parameters.map((row, index) => {
                                const isPredefinedParameter = getTestParameters(request.test_type)
                                    .some(t => t.parameter_name === row.parameter_name);
                                const hasAutoInterpretation = parameterMetadata.get(index)?.normalMin !== undefined;
                                
                                return (
                                <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-3 rounded-md">
                                    <div className="col-span-3">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Parameter / Test Name</label>
                                        <Input
                                            value={row.parameter_name}
                                            onChange={e => updateRow(index, 'parameter_name', e.target.value)}
                                            placeholder="e.g. Hemoglobin"
                                            required
                                            readOnly={isPredefinedParameter}
                                            className={isPredefinedParameter ? 'bg-gray-100 cursor-not-allowed' : ''}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Result</label>
                                        <Input
                                            value={row.result_value}
                                            onChange={e => updateRow(index, 'result_value', e.target.value)}
                                            placeholder="Value"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Unit</label>
                                        <Input
                                            value={row.unit || ''}
                                            onChange={e => updateRow(index, 'unit', e.target.value)}
                                            placeholder="e.g. g/dL"
                                            readOnly={isPredefinedParameter}
                                            className={isPredefinedParameter ? 'bg-gray-100' : ''}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Ref. Range</label>
                                        <Input
                                            value={row.reference_range || ''}
                                            onChange={e => updateRow(index, 'reference_range', e.target.value)}
                                            placeholder="Min - Max"
                                            readOnly={isPredefinedParameter}
                                            className={isPredefinedParameter ? 'bg-gray-100' : ''}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Interpretation</label>
                                        {hasAutoInterpretation ? (
                                            <div className={`w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm font-medium text-center ${
                                                row.interpretation === 'high' ? 'text-red-600 bg-red-50' :
                                                row.interpretation === 'low' ? 'text-orange-600 bg-orange-50' :
                                                row.interpretation === 'normal' ? 'text-green-600 bg-green-50' : 'text-gray-500'
                                            }`}>
                                                {row.interpretation ? row.interpretation.charAt(0).toUpperCase() + row.interpretation.slice(1) : '--'}
                                            </div>
                                        ) : (
                                            <select
                                                className={`w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm font-medium ${
                                                    row.interpretation === 'high' ? 'text-red-600 bg-red-50' :
                                                    row.interpretation === 'low' ? 'text-orange-600 bg-orange-50' :
                                                    row.interpretation === 'normal' ? 'text-green-600 bg-green-50' : 'text-gray-700'
                                                }`}
                                                value={row.interpretation || ''}
                                                onChange={e => updateRow(index, 'interpretation', e.target.value)}
                                            >
                                                <option value="">--</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">High</option>
                                                <option value="low">Low</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="col-span-1 pt-6 text-center">
                                        {!isPredefinedParameter && (
                                            <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveRow(index)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2">Technician Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Medical Technologist *</label>
                                    <Input
                                        required
                                        value={medTech}
                                        onChange={e => setMedTech(e.target.value)}
                                        placeholder="Name of MedTech"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">PRC Number *</label>
                                    <Input
                                        required
                                        value={prcNumber}
                                        onChange={e => setPrcNumber(e.target.value)}
                                        placeholder="License Number"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">Remarks / Conclusion</h3>
                            <Textarea
                                className="h-32"
                                value={overallRemarks}
                                onChange={e => setOverallRemarks(e.target.value)}
                                placeholder="Overall clinical interpretation or remarks..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">Finalize & Submit Results</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
