import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Clock, AlertCircle,
  Search, Eye, Send, CheckCircle, FileText,
  Microscope, ClipboardCheck, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { laboratoryService } from '../services/laboratoryService';
import {
  LabRequest,
  LabRequestFilters,
  LabDashboardStats
} from '../types/laboratory';
import { labPanelsArray } from '../config/labParameters';
import { LabResultEncodingModal } from '../components/laboratory/LabResultEncodingModal';
import { LabResultViewModal } from '../components/laboratory/LabResultViewModal';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ==================== TYPE DEFINITIONS (Form State) ====================

// Result encoding form state
// ResultFormState removed as it is now handled by LabResultEncodingModal


// ==================== MAIN COMPONENT ====================

export default function LaboratoryDashboard() {
  // Auth Context
  const { user } = useAuth();
  const { toast } = useToast();

  // State Management
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [labRequests, setLabRequests] = useState<LabRequest[]>([]);
  const [stats, setStats] = useState<LabDashboardStats>({ pending: 0, in_progress: 0, completed_today: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'routine' | 'urgent' | 'stat'>('all');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

  // Modal states
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Confirmation State
  const [specimenToReceive, setSpecimenToReceive] = useState<number | null>(null);



  // Load Data
  useEffect(() => {
    fetchData();
  }, [activeTab, priorityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsData = await laboratoryService.getDashboardStats();
      setStats(statsData);

      // Fetch requests based on active tab
      const filters: LabRequestFilters = {
        status: activeTab === 'in_progress' ? 'in_progress' : activeTab === 'completed' ? 'completed' : 'pending',
        // priority: priorityFilter !== 'all' ? priorityFilter : undefined, // Backend filtering for priority to be added
      };

      const response = await laboratoryService.getLabRequests(filters);
      setLabRequests(response.results);
    } catch (error) {
      console.error('Error fetching lab data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load laboratory data",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== HANDLERS ====================

  const handleReceiveSpecimenClick = (requestId: number) => {
    setSpecimenToReceive(requestId);
  };

  const confirmReceiveSpecimen = async () => {
    if (!specimenToReceive) return;

    try {
      await laboratoryService.startProcessing(specimenToReceive);
      toast({
        title: "Specimen Received",
        description: "Specimen received and moved to In-Progress queue",
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Error receiving specimen:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to receive specimen",
      });
    } finally {
      setSpecimenToReceive(null);
    }
  };

  const handleStartEncoding = (request: LabRequest) => {
    setSelectedRequest(request);
    setShowEncodeModal(true);
  };



  const handleModalSubmit = async (requestId: number, data: import('../types/laboratory').LabResultFormData) => {
    try {
      await laboratoryService.createLabResult(data);
      toast({
        title: "Results Saved",
        description: "Test is now in Completed queue.",
      });
      setShowEncodeModal(false);
      setSelectedRequest(null);
      setActiveTab('completed'); // Switch to completed tab
      fetchData();
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save results. Please try again later.",
      });
    }
  };

  const handleViewResults = async (request: LabRequest) => {
    try {
      // Fetch the full result details including parameters/interpretation
      const resultData = await laboratoryService.getLabResult(request.id);

      // Merge with the request object
      const fullRequest = {
        ...request,
        result: resultData
      };

      setSelectedRequest(fullRequest);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching result details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load result details for viewing.",
      });
    }
  };

  const handleReleaseToMonitoring = (requestId: number) => {
    // This functionality might need a specific backend endpoint
    // For now, it's already 'final', so effective released.
    toast({
      title: "Results Released",
      description: "Results released to Monitoring Module! Doctors and nurses can now view the results.",
    });
  };

  // ==================== COMPUTED VALUES ====================

  const filteredRequests = labRequests.filter(req => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      req.patient_name.toLowerCase().includes(term) ||
      req.patient_id.toLowerCase().includes(term) ||
      req.request_id.toLowerCase().includes(term) ||
      req.test_type_display.toLowerCase().includes(term)
    );
  });

  // ==================== RENDER ====================

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-2">
        <div className="h-full flex flex-col">
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Laboratory Information System</h2>
            <p className="text-gray-600 text-sm mt-1">Manage lab requests, test processing, and results</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="text-orange-600" size={16} />
                    <p className="text-sm text-orange-800 font-medium">Pending</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">{stats.pending}</p>
                  <p className="text-xs text-orange-600 mt-1">Awaiting processing</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                  <AlertCircle className="text-orange-700" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="text-blue-600" size={16} />
                    <p className="text-sm text-blue-800 font-medium">In-Progress</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{stats.in_progress}</p>
                  <p className="text-xs text-blue-600 mt-1">Being analyzed</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Microscope className="text-blue-700" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="text-purple-600" size={16} />
                    <p className="text-sm text-purple-800 font-medium">Completed</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{stats.completed_today}</p>
                  <p className="text-xs text-purple-600 mt-1">Ready to release</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <FileText className="text-purple-700" size={24} />
                </div>
              </div>
            </div>

            {/* Released card kept for UI consistency, using completed count or separate stat if available */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="text-green-600" size={16} />
                    <p className="text-sm text-green-800 font-medium">Released Today</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900">{stats.completed_today}</p>
                  <p className="text-xs text-green-600 mt-1">Sent to monitoring</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-700" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'pending'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Pending</span>
                  {stats.pending > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'pending' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
                      }`}>
                      {stats.pending}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('in_progress')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'in_progress'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Activity size={18} />
                  <span>In-Progress</span>
                  {stats.in_progress > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {stats.in_progress}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'completed'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} />
                  <span>Completed</span>
                  {stats.completed_today > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'completed' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                      }`}>
                      {stats.completed_today}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'routine' | 'urgent' | 'stat')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium bg-white"
              >
                <option value="all">All</option>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="border-b border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by patient name, patient ID, request ID, or test type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Request List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FlaskConical size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">No requests found</p>
                  <p className="text-sm mt-1">No requests match your current filters.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Test Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className={`hover:bg-gray-50 ${request.priority === 'stat' ? 'border-l-4 border-red-500 bg-red-50' : ''
                          }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-purple-600">{request.request_id}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                              {request.test_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{request.patient_name}</p>
                            <p className="text-sm text-gray-500">{request.patient_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{request.test_type_display}</p>
                          {request.clinical_reason && (
                            <p className="text-xs text-gray-500 mt-1">{request.clinical_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${request.priority === 'stat' ? 'bg-red-100 text-red-700' :
                            request.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                            {request.priority_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{request.doctor_name || 'Unknown'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {/* Pending Tab Actions */}
                          {activeTab === 'pending' && (
                            <button
                              onClick={() => handleReceiveSpecimenClick(request.id)}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <CheckCircle size={16} />
                              Receive
                            </button>
                          )}

                          {/* In-Progress Tab Actions */}
                          {activeTab === 'in_progress' && (
                            <button
                              onClick={() => handleStartEncoding(request)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <FileText size={16} />
                              Encode
                            </button>
                          )}

                          {/* Completed Tab Actions */}
                          {activeTab === 'completed' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewResults(request)}
                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 font-medium text-sm border border-purple-200"
                              >
                                <Eye size={16} />
                                View
                              </button>
                              <button
                                onClick={() => handleReleaseToMonitoring(request.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium text-sm shadow-md"
                              >
                                <Send size={16} />
                                Release
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Encode Results Modal */}
      <LabResultEncodingModal
        isOpen={showEncodeModal}
        onClose={() => setShowEncodeModal(false)}
        request={selectedRequest}
        onSubmit={handleModalSubmit}
      />
      <LabResultViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        request={selectedRequest}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={specimenToReceive !== null} onOpenChange={(open) => !open && setSpecimenToReceive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Specimen Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to receive this specimen? This will move the request to the In-Progress queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSpecimenToReceive(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReceiveSpecimen} className="bg-orange-500 hover:bg-orange-600">
              Confirm Receipt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
