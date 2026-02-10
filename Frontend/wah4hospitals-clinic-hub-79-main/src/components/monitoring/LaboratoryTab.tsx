import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { LabRequest, LabResult } from '../../types/monitoring';

interface LaboratoryTabProps {
    labRequests: LabRequest[];
    onAddRequest?: (request: Omit<LabRequest, 'id'>) => void;
    onUpdateResult?: (requestId: string, result: LabResult) => void;
    userRole?: string; // Role-based permissions
    admissionId?: string; // For creating requests
}

const COMMON_LAB_TESTS = [
    { code: '58410-2', name: 'Complete Blood Count (CBC)' },
    { code: '24323-8', name: 'Comprehensive Metabolic Panel' },
    { code: '2085-9', name: 'HDL Cholesterol' },
    { code: '2089-1', name: 'LDL Cholesterol' },
    { code: '2571-8', name: 'Triglycerides' },
    { code: '1920-8', name: 'Aspartate Aminotransferase (AST)' },
    { code: '1742-6', name: 'Alanine Aminotransferase (ALT)' },
    { code: '2160-0', name: 'Creatinine' },
    { code: '3094-0', name: 'Blood Urea Nitrogen (BUN)' },
    { code: '2345-7', name: 'Glucose' },
    { code: '17861-6', name: 'Calcium' },
    { code: '2777-1', name: 'Phosphorus' },
    { code: '2951-2', name: 'Sodium' },
    { code: '2823-3', name: 'Potassium' },
    { code: '2075-0', name: 'Chloride' },
];

export const LaboratoryTab: React.FC<LaboratoryTabProps> = ({
    labRequests,
    onAddRequest,
    onUpdateResult,
    userRole,
    admissionId,
}) => {
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

    // Role-based permissions
    const normalizedRole = userRole?.toLowerCase() || '';
    const canOrderLabs = normalizedRole === 'doctor'; // Only doctors can order labs
    const canEnterResults = normalizedRole === 'laboratory'; // Only laboratory staff can enter results
    const canViewLabs = ['doctor', 'nurse', 'laboratory'].includes(normalizedRole); // All clinical staff can view

    const handleOrderSubmit = () => {
        if (!orderForm.testCode || !orderForm.testName) {
            alert('Please select a test');
            return;
        }

        const newRequest: Omit<LabRequest, 'id'> = {
            admissionId: admissionId || '', // Use passed admissionId
            testCode: orderForm.testCode,
            testName: orderForm.testName,
            priority: orderForm.priority,
            notes: orderForm.notes,
            lifecycleStatus: 'ordered',
            orderedBy: userRole || 'Unknown',
            orderedAt: new Date().toISOString(),
        };

        onAddRequest?.(newRequest);
        setIsOrderModalOpen(false);
        setOrderForm({ testCode: '', testName: '', priority: 'routine', notes: '' });
    };

    const handleResultSubmit = () => {
        if (!selectedRequest) return;

        if (!resultForm.findings || !resultForm.interpretation || !resultForm.reportedBy) {
            alert('Please fill in all required fields');
            return;
        }

        onUpdateResult?.(selectedRequest.id, resultForm);
        setIsResultModalOpen(false);
        setSelectedRequest(null);
        setResultForm({
            findings: '',
            values: [],
            interpretation: '',
            reportedBy: '',
            reportedAt: new Date().toISOString(),
        });
    };

    const openResultModal = (request: LabRequest) => {
        setSelectedRequest(request);
        if (request.resultContent) {
            setResultForm(request.resultContent);
        }
        setIsResultModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ordered':
                return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Ordered</Badge>;
            case 'requested':
                return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />In Progress</Badge>;
            case 'completed':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
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
                <h3 className="text-lg font-semibold text-gray-900">Laboratory Requests</h3>
                {canOrderLabs && (
                    <Button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Order Lab Test
                    </Button>
                )}
            </div>

            {/* Lab Requests List */}
            <div className="space-y-3">
                {labRequests.length === 0 ? (
                    <Card className="p-8 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">No laboratory requests found</p>
                        {canOrderLabs && (
                            <p className="text-sm text-gray-500 mt-2">Click "Order Lab Test" to create a new request</p>
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
                                        {request.notes && <p><span className="font-medium">Notes:</span> {request.notes}</p>}
                                        {request.resultContent && (
                                            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                                                <p className="font-medium text-green-900 mb-1">Results Available</p>
                                                <p className="text-sm text-green-800">{request.resultContent.interpretation}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="ml-4 flex gap-2">
                                    {request.resultContent && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openResultModal(request)}
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            View Results
                                        </Button>
                                    )}
                                    {canEnterResults && request.lifecycleStatus !== 'completed' && (
                                        <Button
                                            size="sm"
                                            onClick={() => openResultModal(request)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Enter Results
                                        </Button>
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
                        <DialogTitle>Order Laboratory Test</DialogTitle>
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
                            Order Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lab Results Modal */}
            <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRequest?.resultContent ? 'View' : 'Enter'} Lab Results - {selectedRequest?.testName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="findings">Findings</Label>
                            <Textarea
                                id="findings"
                                value={resultForm.findings}
                                onChange={(e) => setResultForm({ ...resultForm, findings: e.target.value })}
                                placeholder="Describe the laboratory findings..."
                                rows={3}
                                disabled={!!selectedRequest?.resultContent && !canEnterResults}
                            />
                        </div>
                        <div>
                            <Label htmlFor="interpretation">Interpretation</Label>
                            <Textarea
                                id="interpretation"
                                value={resultForm.interpretation}
                                onChange={(e) => setResultForm({ ...resultForm, interpretation: e.target.value })}
                                placeholder="Clinical interpretation of results..."
                                rows={3}
                                disabled={!!selectedRequest?.resultContent && !canEnterResults}
                            />
                        </div>
                        <div>
                            <Label htmlFor="reportedBy">Reported By</Label>
                            <Input
                                id="reportedBy"
                                value={resultForm.reportedBy}
                                onChange={(e) => setResultForm({ ...resultForm, reportedBy: e.target.value })}
                                placeholder="Enter your name"
                                disabled={!!selectedRequest?.resultContent && !canEnterResults}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResultModalOpen(false)}>
                            Close
                        </Button>
                        {canEnterResults && !selectedRequest?.resultContent && (
                            <Button onClick={handleResultSubmit} className="bg-green-600 hover:bg-green-700 text-white">
                                Submit Results
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
