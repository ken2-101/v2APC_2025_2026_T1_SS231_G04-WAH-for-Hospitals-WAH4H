import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TestTube, FlaskConical, ClipboardList } from 'lucide-react';
import { LabRequestModal } from '../components/laboratory/LabRequestModal';
import { LabTable } from '../components/laboratory/LabTable';
import { LabResultEncodingModal } from '../components/laboratory/LabResultEncodingModal';
import { LabResultViewModal } from '../components/laboratory/LabResultViewModal';
import { LabRequest, LabResult, LabDashboardStats } from '../types/laboratory';
import { toast } from 'sonner';
import laboratoryService from '../services/laboratoryService';

const Laboratory = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [dashboardStats, setDashboardStats] = useState<LabDashboardStats>({
        pending: 0,
        in_progress: 0,
        completed_today: 0
    });
    const [loading, setLoading] = useState(true);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isEncodingModalOpen, setIsEncodingModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

    // Fetch lab requests on component mount and when activeTab changes
    useEffect(() => {
        fetchLabRequests();
        fetchDashboardStats();
    }, [activeTab]);

    const fetchLabRequests = async () => {
        try {
            setLoading(true);
            const response = await laboratoryService.getLabRequests({ status: activeTab as any });
            setRequests(Array.isArray(response) ? response : response.results);
        } catch (error) {
            console.error('Error fetching lab requests:', error);
            toast.error('Failed to load lab requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const stats = await laboratoryService.getDashboardStats();
            setDashboardStats(stats);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const handleCreateRequest = async (newRequest: any) => {
        try {
            console.log('Creating lab request with data:', newRequest);
            const result = await laboratoryService.createLabRequest(newRequest);
            console.log('Lab request created successfully:', result);
            toast.success('Lab request created successfully');
            fetchLabRequests();
            fetchDashboardStats();
        } catch (error: any) {
            console.error('Error creating lab request:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.detail 
                || error.response?.data?.message 
                || error.message 
                || 'Failed to create lab request';
            toast.error(errorMessage);
        }
    };

    const handleAction = async (request: LabRequest, action: 'start' | 'encode' | 'view') => {
        if (action === 'start') {
            // Move from pending to in_progress
            try {
                await laboratoryService.startProcessing(request.id);
                toast.success('Lab request moved to In-Progress');
                fetchLabRequests();
                fetchDashboardStats();
            } catch (error) {
                console.error('Error starting processing:', error);
                toast.error('Failed to start processing');
            }
        } else if (action === 'encode') {
            setSelectedRequest(request);
            setIsEncodingModalOpen(true);
        } else if (action === 'view') {
            // Fetch full request details including result parameters
            try {
                const fullRequest = await laboratoryService.getLabRequest(request.id);
                setSelectedRequest(fullRequest);
                setIsViewModalOpen(true);
            } catch (error) {
                console.error('Error fetching request details:', error);
                toast.error('Failed to load result details');
            }
        }
    };

    const handleSubmitResults = async (requestId: number, resultsData: any) => {
        try {
            console.log('Submitting lab results:', resultsData);
            const result = await laboratoryService.createLabResult(resultsData);
            console.log('Lab result created successfully:', result);
            toast.success('Results encoded and finalized');
            setIsEncodingModalOpen(false);
            fetchLabRequests();
            fetchDashboardStats();
        } catch (error: any) {
            console.error('Error submitting results:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.detail 
                || error.response?.data?.message 
                || JSON.stringify(error.response?.data)
                || error.message 
                || 'Failed to submit results';
            toast.error(errorMessage);
        }
    };

    // Filter requests based on status (for display purposes)
    const displayRequests = requests;

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
                        <div className="text-2xl font-bold">{dashboardStats.pending}</div>
                        <p className="text-xs text-muted-foreground">Awaiting processing</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In-Progress</CardTitle>
                        <FlaskConical className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.in_progress}</div>
                        <p className="text-xs text-muted-foreground">Currently being analyzed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                        <TestTube className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.completed_today}</div>
                        <p className="text-xs text-muted-foreground">Results released</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="in_progress">In-Progress</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <LabTable requests={displayRequests} onAction={handleAction} statusTab="pending" />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="in_progress" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>In-Progress Tests</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <LabTable requests={displayRequests} onAction={handleAction} statusTab="in_progress" />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Completed Results</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <LabTable requests={displayRequests} onAction={handleAction} statusTab="completed" />
                            )}
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
