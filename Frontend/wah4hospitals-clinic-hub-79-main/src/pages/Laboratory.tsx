import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TestTube, FlaskConical, ClipboardList } from 'lucide-react';
import { LabRequestModal } from '../components/laboratory/LabRequestModal';
import { LabTable } from '../components/laboratory/LabTable';
import { LabResultEncodingModal } from '../components/laboratory/LabResultEncodingModal';
import { LabResultViewModal } from '../components/laboratory/LabResultViewModal';
import { LabRequest, LabResult } from '../types/laboratory';
import { toast } from 'sonner';

const Laboratory = () => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [requests, setRequests] = useState<LabRequest[]>([
        {
            id: 'LR-1001',
            patientId: 'P-2024-001',
            patientName: 'Juan Dela Cruz',
            doctorName: 'Dr. Santos',
            testType: 'CBC',
            clinicalReason: 'Routine Checkup',
            priority: 'Routine',
            status: 'Pending',
            dateRequested: '2024-05-20T08:00:00Z'
        },
        {
            id: 'LR-1002',
            patientId: 'P-2024-002',
            patientName: 'Maria Santos',
            doctorName: 'Dr. Reyes',
            testType: 'Urinalysis',
            clinicalReason: 'Suspected UTI',
            priority: 'STAT',
            status: 'Pending',
            dateRequested: '2024-05-20T09:30:00Z'
        },
        {
            id: 'LR-1003',
            patientId: 'P-2024-005',
            patientName: 'Pedro Penduko',
            doctorName: 'Dr. Lim',
            testType: 'Fecalysis',
            clinicalReason: 'Abdominal Pain',
            priority: 'Routine',
            status: 'In-Progress',
            dateRequested: '2024-05-19T14:00:00Z'
        }
    ]);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isEncodingModalOpen, setIsEncodingModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

    const handleCreateRequest = (newRequest: LabRequest) => {
        setRequests([newRequest, ...requests]);
        toast.success('Lab request created successfully');
    };

    const handleAction = (request: LabRequest, action: 'encode' | 'view') => {
        setSelectedRequest(request);
        if (action === 'encode') {
            setIsEncodingModalOpen(true);
        } else {
            setIsViewModalOpen(true);
        }
    };

    const handleSubmitResults = (requestId: string, results: LabResult[], metadata: any) => {
        setRequests(requests.map(req => {
            if (req.id === requestId) {
                return {
                    ...req,
                    status: 'Completed',
                    results: results,
                    medicalTechnologist: metadata.medTech,
                    prcNumber: metadata.prcNumber,
                    dateCompleted: metadata.dateCompleted
                };
            }
            return req;
        }));
        toast.success('Results encoded and finalized');
    };

    // Filter requests based on status
    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const inProgressRequests = requests.filter(r => r.status === 'In-Progress');
    const completedRequests = requests.filter(r => r.status === 'Completed');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laboratory Information System</h1>
                    <p className="text-gray-600">Manage lab requests, test processing, and results</p>
                </div>
                <Button onClick={() => setIsRequestModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Lab Request
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <ClipboardList className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingRequests.length}</div>
                        <p className="text-xs text-muted-foreground">Awaiting processing</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In-Progress</CardTitle>
                        <FlaskConical className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inProgressRequests.length}</div>
                        <p className="text-xs text-muted-foreground">Currently being analyzed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                        <TestTube className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedRequests.length}</div>
                        <p className="text-xs text-muted-foreground">Results released</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="Pending">Pending</TabsTrigger>
                    <TabsTrigger value="In-Progress">In-Progress</TabsTrigger>
                    <TabsTrigger value="Completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="Pending" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
                        <CardContent>
                            <LabTable requests={pendingRequests} onAction={handleAction} statusTab="Pending" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="In-Progress" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>In-Progress Tests</CardTitle></CardHeader>
                        <CardContent>
                            <LabTable requests={inProgressRequests} onAction={handleAction} statusTab="In-Progress" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="Completed" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Completed Results</CardTitle></CardHeader>
                        <CardContent>
                            <LabTable requests={completedRequests} onAction={handleAction} statusTab="Completed" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <LabRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSubmit={handleCreateRequest}
            />

            <LabResultEncodingModal
                isOpen={isEncodingModalOpen}
                onClose={() => setIsEncodingModalOpen(false)}
                request={selectedRequest}
                onSubmit={handleSubmitResults}
            />

            <LabResultViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                request={selectedRequest}
            />
        </div>
    );
};

export default Laboratory;
