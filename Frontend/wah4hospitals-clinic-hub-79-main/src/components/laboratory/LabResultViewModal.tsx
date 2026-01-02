import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer } from 'lucide-react';
import { LabRequest } from '../../types/laboratory';
import { PrintButton } from '@/components/ui/PrintButton';

interface LabResultViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: LabRequest | null;
}

export const LabResultViewModal: React.FC<LabResultViewModalProps> = ({ isOpen, onClose, request }) => {
    if (!isOpen || !request) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:w-full print:shadow-none">

                {/* Header - Hidden on Print */}
                <div className="border-b px-6 py-4 flex justify-between items-center print:hidden">
                    <h3 className="text-xl font-bold">Laboratory Result Viewer</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" /> Print Results
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
                    </div>
                </div>

                {/* Printable Content */}
                <div className="p-8 print:p-0" id="printable-area">
                    {/* Letterhead */}
                    <div className="text-center mb-8 border-b pb-4">
                        <h1 className="text-2xl font-bold uppercase tracking-wider">WAH 4 Hospital</h1>
                        <p className="text-sm text-gray-500">Laboratory Department</p>
                        <p className="text-sm text-gray-500">123 Health Avenue, Medical City</p>
                    </div>

                    {/* Patient Info Header */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                        <div className="grid grid-cols-3">
                            <span className="font-semibold text-gray-600">Patient Name:</span>
                            <span className="col-span-2 font-medium">{request.patient_name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-semibold text-gray-600">Patient ID:</span>
                            <span className="col-span-2 font-medium">{request.patient_id}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-semibold text-gray-600">Date Requested:</span>
                            <span className="col-span-2">{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-semibold text-gray-600">Date Completed:</span>
                            <span className="col-span-2">{request.result?.finalized_at ? new Date(request.result.finalized_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-semibold text-gray-600">Physician:</span>
                            <span className="col-span-2">{request.doctor_name || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-semibold text-gray-600">Test Type:</span>
                            <span className="col-span-2 font-bold uppercase">{request.test_type_display}</span>
                        </div>
                    </div>

                    {/* Results Table */}
                    <table className="w-full text-sm mb-8">
                        <thead>
                            <tr className="border-b-2 border-gray-800">
                                <th className="text-left py-2 px-2">Test / Parameter</th>
                                <th className="text-center py-2 px-2">Result</th>
                                <th className="text-center py-2 px-2">Unit</th>
                                <th className="text-center py-2 px-2">Reference Range</th>
                                <th className="text-right py-2 px-2">Interpretation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {request.result?.parameters?.map((param, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-2 px-2 font-medium">{param.parameter_name}</td>
                                    <td className="py-2 px-2 text-center font-bold">{param.result_value}</td>
                                    <td className="py-2 px-2 text-center text-gray-500">{param.unit}</td>
                                    <td className="py-2 px-2 text-center text-gray-500">{param.reference_range}</td>
                                    <td className="py-2 px-2 text-right capitalize">{param.interpretation}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer / Signatures */}
                    <div className="mt-12 grid grid-cols-2 gap-12">
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-3/4 mx-auto pt-2">
                                <p className="font-bold">{request.result?.medical_technologist || '_________________'}</p>
                                <p className="text-xs uppercase text-gray-500">Registered Medical Technologist</p>
                                <p className="text-xs text-gray-500">Lic. No. {request.result?.prc_number || '__________'}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-3/4 mx-auto pt-2">
                                <p className="font-bold">Dr. Pathologist, MD, FPSP</p>
                                <p className="text-xs uppercase text-gray-500">Pathologist</p>
                                <p className="text-xs text-gray-500">Lic. No. 0012345</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:w-full">
                        <p>This is a computer generated report.</p>
                        <p>{new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
