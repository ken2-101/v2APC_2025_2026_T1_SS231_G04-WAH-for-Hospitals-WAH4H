import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, AlertCircle, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { LabRequest, LabResult } from '../../types/monitoring';
import { useRole } from '@/contexts/RoleContext';

interface LaboratoryTabProps {
    labRequests: LabRequest[];
    onAddRequest?: (request: Omit<LabRequest, 'id'>) => void;
    onUpdateResult?: (requestId: string, result: LabResult) => void;
    onRefresh?: () => void;
}

const COMMON_LAB_TESTS = [
    // Hematology
    { code: 'cbc', name: 'Complete Blood Count (CBC)' },
    { code: 'platelet_count', name: 'Platelet Count' },
    { code: 'blood_typing', name: 'Blood Typing' },
    { code: 'clotting_time', name: 'Clotting Time' },
    { code: 'bleeding_time', name: 'Bleeding Time' },
    // Microscopy
    { code: 'urinalysis', name: 'Urinalysis' },
    { code: 'fecalysis', name: 'Fecalysis' },
    { code: 'pregnancy_test', name: 'Pregnancy Test' },
    // Chemistry
    { code: 'fbs', name: 'Fasting Blood Sugar (FBS)' },
    { code: 'rbs', name: 'Random Blood Sugar (RBS)' },
    { code: 'lipid_profile', name: 'Lipid Profile' },
    { code: 'creatinine', name: 'Creatinine' },
    { code: 'bua', name: 'Blood Uric Acid' },
    { code: 'bun', name: 'Blood Urea Nitrogen' },
    { code: 'sgpt', name: 'SGPT (ALT)' },
    { code: 'sgot', name: 'SGOT (AST)' },
    { code: 'electrolytes', name: 'Electrolytes' },
    { code: 'blood_chemistry', name: 'Blood Chemistry (Package)' },
    // Serology
    { code: 'hbsag', name: 'HBsAg' },
    { code: 'syphilis', name: 'Syphilis (RPR/VDRL)' },
    { code: 'dengue_duo', name: 'Dengue Duo' },
    { code: 'typhoid', name: 'Typhoid Test' },
    // Microbiology
    { code: 'gram_stain', name: 'Gram Stain' },
    { code: 'afb_stain', name: 'AFB Stain' },
];

export const LaboratoryTab: React.FC<LaboratoryTabProps> = ({
    labRequests,
    onAddRequest,
    onUpdateResult,
    onRefresh
}) => {
    const { currentRole, canModify } = useRole();

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

    // Order Lab Test Form State
    const [orderForm, setOrderForm] = useState({
        testCode: '',
        testName: '',
        priority: 'routine' as 'routine' | 'urgent' | 'stat',
        notes: '',
    });

    // Lab Result Form State
    const [resultForm, setResultForm] = useState<LabResult>({
        findings: '',
        values: [],
        interpretation: '',
        reportedBy: '',
        reportedAt: new Date().toISOString(),
    });

    // Permissions
    const canOrderLabs = currentRole === 'doctor';
    const canViewLabs = currentRole === 'doctor' || currentRole === 'nurse' || currentRole === 'lab_technician';

    const handleOrderSubmit = () => {
        if (!orderForm.testCode || !orderForm.testName) {
            alert('Please select a test');
            return;
        }

        const newRequest: Omit<LabRequest, 'id'> = {
            admissionId: '', // Will be set by parent
            testCode: orderForm.testCode,
            testName: orderForm.testName,
            priority: orderForm.priority,
            notes: orderForm.notes,
            lifecycleStatus: 'ordered',
            orderedBy: currentRole,
            orderedAt: new Date().toISOString(),
        };

        onAddRequest?.(newRequest);
        setIsOrderModalOpen(false);
        setOrderForm({ testCode: '', testName: '', priority: 'routine', notes: '' });
    };

    const getStatusBadge = (status: string) => {
        // In monitoring, we only show completed results
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'stat':
                return <Badge className="bg-red-100 text-red-800">STAT</Badge>;
            case 'urgent':
                return <Badge className="bg-orange-100 text-orange-800">Urgent</Badge>;
            case 'routine':
                return <Badge className="bg-gray-100 text-gray-800">Routine</Badge>;
            default:
                return <Badge>{priority}</Badge>;
        }
    };

    if (!canViewLabs) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">You do not have permission to view laboratory requests.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Laboratory Results</h3>
                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <Button variant="outline" size="icon" onClick={onRefresh} title="Reload Requests">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                    {canOrderLabs && (
                        <Button
                            onClick={() => setIsOrderModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Request Lab Test
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-medium">Monitoring View (Read-Only)</p>
                    <p className="text-blue-700">This shows finalized lab results only. To process lab tests or view detailed results, visit the <a href="/laboratory" className="underline font-medium">Laboratory page</a>.</p>
                </div>
            </div>

            {/* Lab Requests List */}
            <div className="space-y-3">
                {labRequests.length === 0 ? (
                    <Card className="p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No completed laboratory results found</p>
                        {canOrderLabs && (
                            <p className="text-sm text-gray-500 mt-2">Click "Request Lab Test" to create a new request</p>
                        )}
                    </Card>
                ) : (
                    labRequests.map((request) => (
                        <Card key={request.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-900">{request.testName}</h4>
                                        {getStatusBadge(request.lifecycleStatus)}
                                        {getPriorityBadge(request.priority)}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><span className="font-medium">Test Code:</span> {request.testCode}</p>
                                        <p><span className="font-medium">Ordered by:</span> {request.orderedBy}</p>
                                        <p><span className="font-medium">Ordered at:</span> {new Date(request.orderedAt).toLocaleString()}</p>
                                        {request.completedAt && (
                                            <p><span className="font-medium">Completed at:</span> {new Date(request.completedAt).toLocaleString()}</p>
                                        )}
                                        {request.notes && <p><span className="font-medium">Notes:</span> {request.notes}</p>}
                                        {request.resultContent && (
                                            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                                <p className="font-medium text-green-900 mb-1">✓ Results Available</p>
                                                <p className="text-sm text-green-800">{request.resultContent.interpretation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4">
                                    {request.resultContent && (
                                        <a href="/laboratory" target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" variant="outline">
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View in Laboratory
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Order Lab Test Modal */}
            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Request Laboratory Test</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="test">Select Test</Label>
                            <Select
                                value={orderForm.testCode}
                                onValueChange={(value) => {
                                    const test = COMMON_LAB_TESTS.find(t => t.code === value);
                                    setOrderForm({ ...orderForm, testCode: value, testName: test?.name || '' });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a test" />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMMON_LAB_TESTS.map((test) => (
                                        <SelectItem key={test.code} value={test.code}>
                                            {test.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={orderForm.priority}
                                onValueChange={(value: 'routine' | 'urgent' | 'stat') =>
                                    setOrderForm({ ...orderForm, priority: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="routine">Routine</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                    <SelectItem value="stat">STAT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="notes">Clinical Notes</Label>
                            <Textarea
                                id="notes"
                                value={orderForm.notes}
                                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                placeholder="Add any relevant clinical information..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOrderModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleOrderSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Request Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
