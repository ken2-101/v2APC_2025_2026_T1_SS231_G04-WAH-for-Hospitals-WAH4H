import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FlaskConical, Eye, Clock, AlertCircle } from 'lucide-react';
import { LabRequest } from '../../types/laboratory';

interface LabTableProps {
    requests: LabRequest[];
    onAction: (request: LabRequest, action: 'encode' | 'view') => void;
    statusTab: string;
}

export const LabTable: React.FC<LabTableProps> = ({ requests, onAction, statusTab }) => {
    const getPriorityBadge = (priority: string) => {
        return priority === 'STAT'
            ? <Badge className="bg-red-100 text-red-800 border-red-200">STAT</Badge>
            : <Badge variant="outline" className="text-gray-600">Routine</Badge>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'In-Progress': return <FlaskConical className="w-4 h-4 text-blue-500" />;
            case 'Completed': return <FileText className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FlaskConical className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
                <p className="text-gray-500">There are no {statusTab.toLowerCase()} laboratory requests.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium">Request ID</th>
                        <th className="px-4 py-3 text-left font-medium">Patient</th>
                        <th className="px-4 py-3 text-left font-medium">Test Type</th>
                        <th className="px-4 py-3 text-left font-medium">Priority</th>
                        <th className="px-4 py-3 text-left font-medium">Doctor</th>
                        <th className="px-4 py-3 text-left font-medium">Date Requested</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {requests.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-blue-600">{req.id}</td>
                            <td className="px-4 py-3">
                                <div className="font-medium">{req.patientName}</div>
                                <div className="text-xs text-gray-500">{req.patientId}</div>
                            </td>
                            <td className="px-4 py-3">{req.testType}</td>
                            <td className="px-4 py-3">{getPriorityBadge(req.priority)}</td>
                            <td className="px-4 py-3 text-gray-600">{req.doctorName}</td>
                            <td className="px-4 py-3 text-gray-600">
                                {new Date(req.dateRequested).toLocaleDateString()}
                                <div className="text-xs text-gray-400">{new Date(req.dateRequested).toLocaleTimeString()}</div>
                            </td>
                            <td className="px-4 py-3">
                                {req.status === 'Completed' ? (
                                    <Button size="sm" variant="outline" onClick={() => onAction(req, 'view')} className="text-blue-600 hover:text-blue-700">
                                        <Eye className="w-4 h-4 mr-1" /> View Result
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={() => onAction(req, 'encode')} className="bg-blue-600 hover:bg-blue-700">
                                        <FlaskConical className="w-4 h-4 mr-1" /> Process
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
