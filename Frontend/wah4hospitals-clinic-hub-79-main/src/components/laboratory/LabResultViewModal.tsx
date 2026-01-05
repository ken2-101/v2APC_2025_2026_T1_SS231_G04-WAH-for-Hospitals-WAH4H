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
        <>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-area, #printable-area * {
                        visibility: visible;
                    }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0.4in 0.5in;
                        font-size: 10pt;
                    }
                    .print-hide {
                        display: none !important;
                    }
                    @page {
                        margin: 0;
                        size: letter portrait;
                    }
                    
                    /* Compact spacing for print */
                    #printable-area h1 {
                        font-size: 18pt;
                        margin-bottom: 4px;
                    }
                    #printable-area h2 {
                        font-size: 14pt;
                        margin-bottom: 8px;
                    }
                    #printable-area h3 {
                        font-size: 10pt;
                        margin-bottom: 6px;
                    }
                    #printable-area p {
                        font-size: 9pt;
                        margin: 2px 0;
                    }
                    #printable-area .letterhead {
                        margin-bottom: 12px;
                        padding-bottom: 8px;
                    }
                    #printable-area .test-title {
                        margin-bottom: 12px;
                    }
                    #printable-area .patient-info-section {
                        margin-bottom: 12px;
                        padding: 8px;
                    }
                    #printable-area .patient-info-section > div {
                        gap: 4px;
                    }
                    #printable-area .results-table {
                        margin-bottom: 12px;
                    }
                    #printable-area table {
                        font-size: 9pt;
                    }
                    #printable-area table th,
                    #printable-area table td {
                        padding: 4px 6px;
                    }
                    #printable-area .signature-section {
                        margin-top: 20px;
                        gap: 24px;
                    }
                    #printable-area .signature-section > div {
                        padding-top: 16px;
                    }
                    #printable-area .footer-section {
                        margin-top: 16px;
                        padding-top: 8px;
                    }
                    #printable-area .remarks-section {
                        margin-bottom: 12px;
                        padding: 8px;
                    }
                    
                    /* Prevent page breaks */
                    .patient-info-section,
                    .results-table,
                    .signature-section,
                    .remarks-section {
                        page-break-inside: avoid;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

                    {/* Header - Hidden on Print */}
                    <div className="border-b px-6 py-4 flex justify-between items-center print-hide">
                        <h3 className="text-xl font-bold">Laboratory Result Viewer</h3>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" /> Print Results
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
                        </div>
                    </div>

                {/* Printable Content */}
                <div className="p-8" id="printable-area">
                    {/* Letterhead */}
                    <div className="text-center mb-6 border-b-2 border-gray-800 pb-4 letterhead">
                        <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">WAH4H Medical Center</h1>
                        <p className="text-sm text-gray-600 mt-1">Clinical Laboratory</p>
                        <p className="text-xs text-gray-500 mt-0.5">Address Line 1, City, Province | Tel: (123) 456-7890</p>
                    </div>

                    <div className="text-center mb-6 test-title">
                        <h2 className="text-xl font-bold uppercase tracking-wide border-b border-gray-400 inline-block px-4 pb-1">
                            {request.test_type_display}
                        </h2>
                    </div>

                    {/* Patient Information Section */}
                    <div className="mb-6 bg-gray-50 p-4 rounded patient-info-section">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Patient Name:</span>
                                <span className="font-medium flex-1">{request.patient_name}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Patient ID:</span>
                                <span className="font-medium flex-1">{request.patient_id}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Age/Sex:</span>
                                <span className="flex-1">{request.patient_details?.date_of_birth 
                                    ? `${Math.floor((new Date().getTime() - new Date(request.patient_details.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))} yrs`
                                    : 'N/A'} / {request.patient_details?.sex === 'M' ? 'Male' : 'Female'}
                                </span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Ward/Room:</span>
                                <span className="flex-1">
                                    {request.admission_details 
                                        ? `${request.admission_details.ward} - ${request.admission_details.room} - ${request.admission_details.bed}`
                                        : request.ward_room_bed || 'N/A'
                                    }
                                </span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Requesting MD:</span>
                                <span className="flex-1">{request.doctor_name || 'N/A'}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Request ID:</span>
                                <span className="flex-1 font-mono">{request.request_id}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Date Requested:</span>
                                <span className="flex-1">{new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex">
                                <span className="font-semibold text-gray-700 w-32">Date Completed:</span>
                                <span className="flex-1 font-medium">{request.result?.finalized_at 
                                    ? new Date(request.result.finalized_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="mb-8 results-table">
                        <h3 className="text-sm font-bold uppercase text-gray-700 mb-2 border-b border-gray-400 pb-1">Test Results</h3>
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-800 text-white">
                                    <th className="text-left py-2 px-3 font-semibold">Parameter</th>
                                    <th className="text-center py-2 px-3 font-semibold">Result</th>
                                    <th className="text-center py-2 px-3 font-semibold">Unit</th>
                                    <th className="text-center py-2 px-3 font-semibold">Reference Range</th>
                                    <th className="text-center py-2 px-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {request.result?.parameters && request.result.parameters.length > 0 ? (
                                    request.result.parameters.map((param, i) => (
                                        <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                            <td className="py-2.5 px-3 font-medium text-gray-800">{param.parameter_name}</td>
                                            <td className="py-2.5 px-3 text-center font-bold text-gray-900">{param.result_value}</td>
                                            <td className="py-2.5 px-3 text-center text-gray-600">{param.unit || '—'}</td>
                                            <td className="py-2.5 px-3 text-center text-gray-600">{param.reference_range || '—'}</td>
                                            <td className={`py-2.5 px-3 text-center font-semibold uppercase text-xs ${
                                                param.interpretation === 'high' ? 'text-red-600' :
                                                param.interpretation === 'low' ? 'text-orange-600' :
                                                param.interpretation === 'normal' ? 'text-green-600' : 'text-gray-500'
                                            }`}>
                                                {param.interpretation ? param.interpretation : '—'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-gray-500 italic">No results available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Remarks Section */}
                    {request.result?.remarks && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 p-3 rounded remarks-section">
                            <h3 className="text-sm font-bold uppercase text-gray-700 mb-1">Remarks / Clinical Interpretation:</h3>
                            <p className="text-sm text-gray-800">{request.result.remarks}</p>
                        </div>
                    )}

                    {/* Signature Section */}
                    <div className="mt-12 grid grid-cols-2 gap-16 signature-section">
                        <div className="text-center">
                            <div className="w-full pt-8">
                                <div className="border-t-2 border-black w-3/4 mx-auto mb-2"></div>
                                <p className="font-bold text-sm">{request.result?.medical_technologist || '___________________'}</p>
                                <p className="text-xs uppercase text-gray-600 mt-0.5">Medical Technologist</p>
                                <p className="text-xs text-gray-500 mt-0.5">PRC License No.: {request.result?.prc_number || '____________'}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="w-full pt-8">
                                <div className="border-t-2 border-black w-3/4 mx-auto mb-2"></div>
                                <p className="font-bold text-sm">_____________________</p>
                                <p className="text-xs uppercase text-gray-600 mt-0.5">Pathologist</p>
                                <p className="text-xs text-gray-500 mt-0.5">PRC License No.: ____________</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-3 border-t border-gray-300 text-center footer-section">
                        <p className="text-xs text-gray-500 italic">This is a computer-generated report. No signature required.</p>
                        <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}</p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};
