import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FlaskConical, Eye, Clock } from 'lucide-react';

interface LabTableProps {
    requests: any[];
    onAction: (request: any, action: 'start' | 'encode' | 'view') => void;
    statusTab: string;
}

export const LabTable: React.FC<LabTableProps> = ({ requests, onAction, statusTab }) => {
    const getPriorityBadge = (priority: string) => {
        return priority === 'stat'
            ? <Badge className="bg-red-100 text-red-800 border-red-200">STAT</Badge>
            : <Badge variant="outline" className="text-gray-600">Routine</Badge>;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
            case 'in_progress': return <FlaskConical className="w-4 h-4 text-blue-500" />;
            case 'completed': return <FileText className="w-4 h-4 text-green-500" />;
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
                            <td className="px-4 py-3 font-medium text-blue-600">{req.request_id}</td>
                            <td className="px-4 py-3">
                                <div className="font-medium">{req.patient_name}</div>
                                <div className="text-xs text-gray-500">{req.patient_id}</div>
                            </td>
                            <td className="px-4 py-3">{req.test_type_display}</td>
                            <td className="px-4 py-3">{getPriorityBadge(req.priority)}</td>
                            <td className="px-4 py-3 text-gray-600">{req.doctor_name || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-600">
                                {new Date(req.created_at).toLocaleDateString()}
                                <div className="text-xs text-gray-400">{new Date(req.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="px-4 py-3">
                                {req.status === 'pending' && (
                                    <Button size="sm" onClick={() => onAction(req, 'start')} className="bg-orange-600 hover:bg-orange-700">
                                        <FlaskConical className="w-4 h-4 mr-1" /> Start Processing
                                    </Button>
                                )}
                                {req.status === 'in_progress' && (
                                    <Button size="sm" onClick={() => onAction(req, 'encode')} className="bg-blue-600 hover:bg-blue-700">
                                        <FileText className="w-4 h-4 mr-1" /> Encode Results
                                    </Button>
                                )}
                                {req.status === 'completed' && (
                                    <Button size="sm" variant="outline" onClick={() => onAction(req, 'view')} className="text-green-600 hover:text-green-700">
                                        <Eye className="w-4 h-4 mr-1" /> View Results
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