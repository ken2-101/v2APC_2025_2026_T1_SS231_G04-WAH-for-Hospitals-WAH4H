import React, { useState } from 'react';
import { 
  FlaskConical, Beaker, Clock, AlertCircle, Check, X, ChevronRight,
  Plus, Search, Eye, Printer, Send, CheckCircle, PlayCircle, FileText,
  User, Calendar, AlertTriangle, Microscope, ClipboardCheck, Activity
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

// FHIR DiagnosticReport (from laboratory_models.py)
interface DiagnosticReport {
  diagnostic_report_id: number;
  identifier: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  subject_id: number;
  subject_display: string; // Patient name
  subject_patient_id: string; // Patient ID (P-XXX)
  encounter_id: number;
  performer_id?: number;
  results_interpreter_id?: number;
  code_code: string; // Test code (CBC, URINALYSIS, etc.)
  code_display: string; // Test name
  category_code: string;
  category_display: string;
  conclusion?: string;
  effective_datetime?: string;
  issued_datetime?: string;
  
  // Lifecycle tracking (custom)
  lifecycleStatus: 'pending' | 'received' | 'in-progress' | 'completed' | 'released';
  priority: 'routine' | 'urgent' | 'stat';
  
  // Lab technician who released results
  releasedBy?: string;
  orderedBy: string; // Doctor name
  orderedAt: string;
  requestedBy?: string; // Nurse name
  requestedAt?: string;
  receivedBy?: string; // Lab tech who received specimen
  receivedAt?: string;
  processedBy?: string; // Lab tech who encoded results
  processedAt?: string;
  releasedAt?: string;
  clinicalReason?: string;
  
  // Results
  results?: DiagnosticReportResult[];
}

interface DiagnosticReportResult {
  parameter: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  flag?: 'LOW' | 'HIGH' | 'NORMAL' | 'CRITICAL';
  interpretation?: string;
}

// FHIR Specimen
interface Specimen {
  specimen_id: number;
  subject_id: number;
  type: string;
  collection_datetime?: string;
  collection_method?: string;
  collector_id?: number;
  received_time?: string;
  status: 'available' | 'unavailable';
}

// Result encoding form state
interface ResultFormState {
  // CBC specific
  hemoglobin?: string;
  rbc?: string;
  wbc?: string;
  hematocrit?: string;
  platelets?: string;
  
  // Urinalysis specific
  color?: string;
  clarity?: string;
  ph?: string;
  specificGravity?: string;
  protein?: string;
  glucose?: string;
  ketones?: string;
  blood?: string;
  leukocytes?: string;
  
  // Generic
  findings?: string;
  interpretation?: string;
  
  // Technician details
  technicianName?: string;
  technicianLicense?: string;
  pathologistName?: string;
  pathologistLicense?: string;
}

// ==================== MOCK DATA (FHIR-COMPLIANT) ====================

const mockLabRequests: DiagnosticReport[] = [
  {
    diagnostic_report_id: 1001,
    identifier: 'LR-1001',
    status: 'registered',
    subject_id: 1,
    subject_display: 'Juan Dela Cruz',
    subject_patient_id: 'P-2024-001',
    encounter_id: 1001,
    code_code: 'CBC',
    code_display: 'Complete Blood Count (CBC)',
    category_code: 'LAB',
    category_display: 'Laboratory',
    effective_datetime: '2026-02-09T08:00:00Z',
    lifecycleStatus: 'pending',
    priority: 'routine',
    orderedBy: 'Dr. Santos',
    orderedAt: '2026-02-09T08:00:00Z',
    requestedBy: 'Nurse Rodriguez',
    requestedAt: '2026-02-09T08:15:00Z',
    clinicalReason: 'Pre-operative workup'
  },
  {
    diagnostic_report_id: 1002,
    identifier: 'LR-1002',
    status: 'registered',
    subject_id: 2,
    subject_display: 'Maria Santos',
    subject_patient_id: 'P-2024-002',
    encounter_id: 1002,
    code_code: 'URINALYSIS',
    code_display: 'Urinalysis',
    category_code: 'LAB',
    category_display: 'Laboratory',
    effective_datetime: '2026-02-09T09:30:00Z',
    lifecycleStatus: 'pending',
    priority: 'stat',
    orderedBy: 'Dr. Reyes',
    orderedAt: '2026-02-09T09:30:00Z',
    requestedBy: 'Nurse Cruz',
    requestedAt: '2026-02-09T09:35:00Z',
    clinicalReason: 'Suspected UTI'
  },
  {
    diagnostic_report_id: 1003,
    identifier: 'LR-1003',
    status: 'partial',
    subject_id: 3,
    subject_display: 'Pedro Penduko',
    subject_patient_id: 'P-2024-005',
    encounter_id: 1003,
    code_code: 'FECALYSIS',
    code_display: 'Fecalysis',
    category_code: 'LAB',
    category_display: 'Laboratory',
    effective_datetime: '2026-02-08T14:00:00Z',
    lifecycleStatus: 'in-progress',
    priority: 'routine',
    orderedBy: 'Dr. Lim',
    orderedAt: '2026-02-08T14:00:00Z',
    requestedBy: 'Nurse Garcia',
    requestedAt: '2026-02-08T14:10:00Z',
    receivedBy: 'Med Tech Sarah Lee',
    receivedAt: '2026-02-08T15:00:00Z',
    clinicalReason: 'Gastrointestinal complaints'
  },
  {
    diagnostic_report_id: 1004,
    identifier: 'LR-1004',
    status: 'final',
    subject_id: 4,
    subject_display: 'Ana Reyes',
    subject_patient_id: 'P-2024-008',
    encounter_id: 1004,
    code_code: 'CBC',
    code_display: 'Complete Blood Count (CBC)',
    category_code: 'LAB',
    category_display: 'Laboratory',
    effective_datetime: '2026-02-09T06:00:00Z',
    issued_datetime: '2026-02-09T10:30:00Z',
    lifecycleStatus: 'completed',
    priority: 'urgent',
    orderedBy: 'Dr. Fernandez',
    orderedAt: '2026-02-09T06:00:00Z',
    requestedBy: 'Nurse Lopez',
    requestedAt: '2026-02-09T06:10:00Z',
    receivedBy: 'Med Tech Sarah Lee',
    receivedAt: '2026-02-09T07:00:00Z',
    processedBy: 'Med Tech Sarah Lee',
    processedAt: '2026-02-09T10:30:00Z',
    conclusion: 'Mild leukocytosis noted. Clinical correlation recommended.',
    clinicalReason: 'Fever investigation',
    results: [
      { parameter: 'WBC', value: 12.5, unit: 'x10^9/L', referenceRange: '4.0-11.0', flag: 'HIGH' },
      { parameter: 'RBC', value: 4.8, unit: 'x10^12/L', referenceRange: '4.2-5.9', flag: 'NORMAL' },
      { parameter: 'Hemoglobin', value: 14.2, unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'NORMAL' },
      { parameter: 'Hematocrit', value: 42, unit: '%', referenceRange: '37-47', flag: 'NORMAL' },
      { parameter: 'Platelets', value: 280, unit: 'x10^9/L', referenceRange: '150-400', flag: 'NORMAL' }
    ]
  },
  {
    diagnostic_report_id: 1005,
    identifier: 'LR-1005',
    status: 'final',
    subject_id: 5,
    subject_display: 'Carlos Martinez',
    subject_patient_id: 'P-2024-010',
    encounter_id: 1005,
    code_code: 'URINALYSIS',
    code_display: 'Urinalysis',
    category_code: 'LAB',
    category_display: 'Laboratory',
    effective_datetime: '2026-02-09T07:00:00Z',
    issued_datetime: '2026-02-09T11:00:00Z',
    lifecycleStatus: 'completed',
    priority: 'stat',
    orderedBy: 'Dr. Emergency',
    orderedAt: '2026-02-09T07:00:00Z',
    requestedBy: 'Nurse Urgent',
    requestedAt: '2026-02-09T07:05:00Z',
    receivedBy: 'Med Tech Sarah Lee',
    receivedAt: '2026-02-09T08:00:00Z',
    processedBy: 'Med Tech Sarah Lee',
    processedAt: '2026-02-09T11:00:00Z',
    conclusion: 'Urinalysis shows presence of bacteria and leukocytes. Possible urinary tract infection.',
    clinicalReason: 'Dysuria and fever',
    results: [
      { parameter: 'Color', value: 'Yellow', unit: '', referenceRange: 'Yellow', flag: 'NORMAL' },
      { parameter: 'Clarity', value: 'Cloudy', unit: '', referenceRange: 'Clear', flag: 'HIGH' },
      { parameter: 'pH', value: '7.0', unit: '', referenceRange: '5.0-8.0', flag: 'NORMAL' },
      { parameter: 'Specific Gravity', value: '1.020', unit: '', referenceRange: '1.005-1.030', flag: 'NORMAL' },
      { parameter: 'Protein', value: 'Trace', unit: '', referenceRange: 'Negative', flag: 'HIGH' },
      { parameter: 'Glucose', value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
      { parameter: 'Ketones', value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
      { parameter: 'Blood', value: 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
      { parameter: 'Leukocytes', value: '+', unit: '', referenceRange: 'Negative', flag: 'HIGH' }
    ]
  },
  {
    diagnostic_report_id: 1006,
    identifier: 'LR-1006',
    status: 'final',
    subject_id: 6,
    subject_display: 'Elena Gutierrez',
    subject_patient_id: 'P-2024-012',
    encounter_id: 1006,
    code_code: 'CBC',
    code_display: 'Complete Blood Count (CBC)',
    category_code: 'LAB',
    category_display: 'Laboratory',
    effective_datetime: '2026-02-08T10:00:00Z',
    issued_datetime: '2026-02-08T16:30:00Z',
    lifecycleStatus: 'released',
    priority: 'routine',
    orderedBy: 'Dr. Martinez',
    orderedAt: '2026-02-08T10:00:00Z',
    requestedBy: 'Nurse Santos',
    requestedAt: '2026-02-08T10:15:00Z',
    receivedBy: 'Med Tech John Doe',
    receivedAt: '2026-02-08T11:00:00Z',
    processedBy: 'Med Tech John Doe',
    processedAt: '2026-02-08T16:30:00Z',
    releasedAt: '2026-02-08T16:45:00Z',
    releasedBy: 'Med Tech John Doe',
    conclusion: 'All values within normal limits. No abnormalities detected.',
    clinicalReason: 'Annual checkup',
    results: [
      { parameter: 'WBC', value: 7.2, unit: 'x10^9/L', referenceRange: '4.0-11.0', flag: 'NORMAL' },
      { parameter: 'RBC', value: 4.5, unit: 'x10^12/L', referenceRange: '4.2-5.9', flag: 'NORMAL' },
      { parameter: 'Hemoglobin', value: 13.8, unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'NORMAL' },
      { parameter: 'Hematocrit', value: 41, unit: '%', referenceRange: '37-47', flag: 'NORMAL' },
      { parameter: 'Platelets', value: 220, unit: 'x10^9/L', referenceRange: '150-400', flag: 'NORMAL' }
    ]
  }
];

// ==================== MAIN COMPONENT ====================

export default function LaboratoryDashboard() {
  // State Management
  const [activeTab, setActiveTab] = useState<'pending' | 'in-progress' | 'completed' | 'released'>('pending');
  const [labRequests, setLabRequests] = useState<DiagnosticReport[]>(mockLabRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'routine' | 'urgent' | 'stat'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DiagnosticReport | null>(null);
  
  // Modal states
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Result form state
  const [resultForm, setResultForm] = useState<ResultFormState>({
    technicianName: '',
    technicianLicense: '',
    pathologistName: '',
    pathologistLicense: '',
    findings: '',
    interpretation: ''
  });

  // ==================== HANDLERS ====================

  const handleReceiveSpecimen = (requestId: number) => {
    const updatedRequests = labRequests.map(req =>
      req.diagnostic_report_id === requestId
        ? {
            ...req,
            lifecycleStatus: 'received' as const,
            receivedBy: 'Med Tech Sarah Lee',
            receivedAt: new Date().toISOString()
          }
        : req
    );
    setLabRequests(updatedRequests);
    alert('✅ Specimen received and moved to In-Progress queue');
  };

  const handleStartEncoding = (request: DiagnosticReport) => {
    setSelectedRequest(request);
    setResultForm({
      technicianName: 'Sarah Lee',
      technicianLicense: 'RMT-12345',
      pathologistName: 'Dr. Pathologist, MD, FPSP',
      pathologistLicense: 'PRC-0012345',
      findings: '',
      interpretation: ''
    });
    setShowEncodeModal(true);
  };

  const handleSaveResults = () => {
    if (!selectedRequest) return;

    let results: DiagnosticReportResult[] = [];
    let conclusion = '';

    // CBC-specific processing
    if (selectedRequest.code_code === 'CBC') {
      const wbc = parseFloat(resultForm.wbc || '0');
      const rbc = parseFloat(resultForm.rbc || '0');
      const hgb = parseFloat(resultForm.hemoglobin || '0');
      const hct = parseFloat(resultForm.hematocrit || '0');
      const plt = parseFloat(resultForm.platelets || '0');

      results = [
        {
          parameter: 'WBC',
          value: wbc,
          unit: 'x10^9/L',
          referenceRange: '4.0-11.0',
          flag: wbc < 4.0 ? 'LOW' : wbc > 11.0 ? 'HIGH' : 'NORMAL'
        },
        {
          parameter: 'RBC',
          value: rbc,
          unit: 'x10^12/L',
          referenceRange: '4.2-5.9',
          flag: rbc < 4.2 ? 'LOW' : rbc > 5.9 ? 'HIGH' : 'NORMAL'
        },
        {
          parameter: 'Hemoglobin',
          value: hgb,
          unit: 'g/dL',
          referenceRange: '12.0-16.0',
          flag: hgb < 12.0 ? 'LOW' : hgb > 16.0 ? 'HIGH' : 'NORMAL'
        },
        {
          parameter: 'Hematocrit',
          value: hct,
          unit: '%',
          referenceRange: '37-47',
          flag: hct < 37 ? 'LOW' : hct > 47 ? 'HIGH' : 'NORMAL'
        },
        {
          parameter: 'Platelets',
          value: plt,
          unit: 'x10^9/L',
          referenceRange: '150-400',
          flag: plt < 150 ? 'LOW' : plt > 400 ? 'HIGH' : 'NORMAL'
        }
      ];

      // Auto-generate conclusion based on abnormalities
      const abnormalities = results.filter(r => r.flag !== 'NORMAL');
      if (abnormalities.length === 0) {
        conclusion = 'All values within normal limits. No abnormalities detected.';
      } else {
        const abnormalParams = abnormalities.map(a => `${a.parameter} (${a.flag})`).join(', ');
        conclusion = `Abnormal findings: ${abnormalParams}. ${resultForm.interpretation || 'Clinical correlation recommended.'}`;
      }
    }
    // Urinalysis-specific processing
    else if (selectedRequest.code_code === 'URINALYSIS') {
      results = [
        { parameter: 'Color', value: resultForm.color || 'Yellow', unit: '', referenceRange: 'Yellow', flag: 'NORMAL' },
        { parameter: 'Clarity', value: resultForm.clarity || 'Clear', unit: '', referenceRange: 'Clear', flag: 'NORMAL' },
        { parameter: 'pH', value: resultForm.ph || '6.0', unit: '', referenceRange: '5.0-8.0', flag: 'NORMAL' },
        { parameter: 'Specific Gravity', value: resultForm.specificGravity || '1.015', unit: '', referenceRange: '1.005-1.030', flag: 'NORMAL' },
        { parameter: 'Protein', value: resultForm.protein || 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
        { parameter: 'Glucose', value: resultForm.glucose || 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
        { parameter: 'Ketones', value: resultForm.ketones || 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
        { parameter: 'Blood', value: resultForm.blood || 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' },
        { parameter: 'Leukocytes', value: resultForm.leukocytes || 'Negative', unit: '', referenceRange: 'Negative', flag: 'NORMAL' }
      ];
      conclusion = resultForm.findings || 'Urinalysis within normal limits.';
    }
    // Generic test
    else {
      conclusion = resultForm.findings || 'Test completed.';
    }

    const updatedRequests = labRequests.map(req =>
      req.diagnostic_report_id === selectedRequest.diagnostic_report_id
        ? {
            ...req,
            status: 'final' as const,
            lifecycleStatus: 'completed' as const,
            processedBy: resultForm.technicianName,
            processedAt: new Date().toISOString(),
            issued_datetime: new Date().toISOString(),
            conclusion,
            results
          }
        : req
    );

    setLabRequests(updatedRequests);
    setShowEncodeModal(false);
    setSelectedRequest(null);
    alert('✅ Results saved and finalized!\n\nTest is now in Completed queue.');
  };

  const handlePrintResults = (request: DiagnosticReport) => {
    setSelectedRequest(request);
    setShowPrintModal(true);
  };

  const handleReleaseToMonitoring = (requestId: number) => {
    const updatedRequests = labRequests.map(req =>
      req.diagnostic_report_id === requestId
        ? {
            ...req,
            lifecycleStatus: 'released' as const,
            releasedAt: new Date().toISOString(),
            releasedBy: 'Med Tech Sarah Lee'
          }
        : req
    );
    setLabRequests(updatedRequests);
    alert('✅ Results released to Monitoring Module!\n\nDoctors and nurses can now view the results.\n\nThe report has been moved to the Released tab.');
  };

  // ==================== COMPUTED VALUES ====================

  const pendingCount = labRequests.filter(r => r.lifecycleStatus === 'pending').length;
  const inProgressCount = labRequests.filter(r => r.lifecycleStatus === 'received' || r.lifecycleStatus === 'in-progress').length;
  const completedCount = labRequests.filter(r => r.lifecycleStatus === 'completed').length;
  const releasedTodayCount = labRequests.filter(r => {
    if (r.lifecycleStatus !== 'released') return false;
    if (!r.releasedAt) return false;
    const today = new Date().toISOString().split('T')[0];
    const releasedDate = r.releasedAt.split('T')[0];
    return today === releasedDate;
  }).length;

  const filteredRequests = labRequests.filter(req => {
    const matchesSearch = 
      req.subject_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.subject_patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.code_display.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

    const matchesTab = 
      (activeTab === 'pending' && req.lifecycleStatus === 'pending') ||
      (activeTab === 'in-progress' && (req.lifecycleStatus === 'received' || req.lifecycleStatus === 'in-progress')) ||
      (activeTab === 'completed' && req.lifecycleStatus === 'completed') ||
      (activeTab === 'released' && req.lifecycleStatus === 'released');

    return matchesSearch && matchesPriority && matchesTab;
  });

  // ==================== RENDER ====================

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center">
                <Beaker className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WAH4H Laboratory</h1>
                <p className="text-xs text-gray-500">FHIR DiagnosticReport Processing</p>
              </div>
            </div>
            
            <div className="ml-8 flex items-center gap-2 text-sm text-gray-600">
              <span className="cursor-pointer hover:text-gray-900">Dashboard</span>
              <ChevronRight size={16} />
              <span className="font-medium text-purple-600">Laboratory</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-sm">
              DU
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Demo User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
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
                  <p className="text-3xl font-bold text-orange-900">{pendingCount}</p>
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
                  <p className="text-3xl font-bold text-blue-900">{inProgressCount}</p>
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
                  <p className="text-3xl font-bold text-purple-900">{completedCount}</p>
                  <p className="text-xs text-purple-600 mt-1">Ready to release</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <FileText className="text-purple-700" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="text-green-600" size={16} />
                    <p className="text-sm text-green-800 font-medium">Released Today</p>
                  </div>
                  <p className="text-3xl font-bold text-green-900">{releasedTodayCount}</p>
                  <p className="text-xs text-green-600 mt-1">Sent to monitoring</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <Send className="text-green-700" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'pending'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Pending</span>
                  {pendingCount > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'pending' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('in-progress')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'in-progress'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity size={18} />
                  <span>In-Progress</span>
                  {inProgressCount > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {inProgressCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'completed'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} />
                  <span>Completed</span>
                  {completedCount > 0 && (
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'completed' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {completedCount}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('released')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === 'released'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Send size={18} />
                  <span>Released</span>
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
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FlaskConical size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">No requests found</p>
                  <p className="text-sm mt-1">
                    {activeTab === 'pending' && 'There are no pending laboratory requests.'}
                    {activeTab === 'in-progress' && 'No tests are currently being processed.'}
                    {activeTab === 'completed' && 'No completed tests awaiting release.'}
                    {activeTab === 'released' && 'No released results available.'}
                  </p>
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
                        key={request.diagnostic_report_id} 
                        className={`hover:bg-gray-50 ${
                          request.priority === 'stat' ? 'border-l-4 border-red-500 bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-purple-600">{request.identifier}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              request.code_code === 'CBC' ? 'bg-blue-100 text-blue-700' :
                              request.code_code === 'URINALYSIS' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {request.code_code}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{request.subject_display}</p>
                            <p className="text-sm text-gray-500">{request.subject_patient_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{request.code_display}</p>
                          {request.clinicalReason && (
                            <p className="text-xs text-gray-500 mt-1">{request.clinicalReason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            request.priority === 'stat' ? 'bg-red-100 text-red-700' :
                            request.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {request.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{request.orderedBy}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {new Date(request.orderedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.orderedAt).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {/* Pending Tab Actions */}
                          {activeTab === 'pending' && (
                            <button
                              onClick={() => handleReceiveSpecimen(request.diagnostic_report_id)}
                              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <CheckCircle size={16} />
                              Receive Specimen
                            </button>
                          )}

                          {/* In-Progress Tab Actions */}
                          {activeTab === 'in-progress' && (
                            <button
                              onClick={() => handleStartEncoding(request)}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium text-sm"
                            >
                              <FileText size={16} />
                              Encode Results
                            </button>
                          )}

                          {/* Completed Tab Actions */}
                          {activeTab === 'completed' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePrintResults(request)}
                                className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 font-medium text-sm border border-purple-200"
                              >
                                <Eye size={16} />
                                View
                              </button>
                              <button
                                onClick={() => handleReleaseToMonitoring(request.diagnostic_report_id)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 font-medium text-sm shadow-md"
                              >
                                <Send size={16} />
                                Release
                              </button>
                            </div>
                          )}

                          {/* Released Tab - No Actions, Just Status */}
                          {activeTab === 'released' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold border border-green-200">
                              <Check size={16} />
                              Sent
                            </span>
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
      {showEncodeModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-purple-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={24} />
                <div>
                  <h3 className="text-lg font-semibold">Encode Lab Results</h3>
                  <p className="text-sm text-purple-100 mt-0.5">
                    Request ID: {selectedRequest.identifier} • {selectedRequest.code_display}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEncodeModal(false)}
                className="text-white hover:bg-purple-700 rounded-full p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Patient Info */}
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-1">Patient</p>
                    <p className="font-semibold text-purple-900">{selectedRequest.subject_display}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-1">Doctor</p>
                    <p className="font-semibold text-purple-900">{selectedRequest.orderedBy}</p>
                  </div>
                </div>
              </div>

              {/* Test Results Section */}
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Beaker size={16} />
                Test Results
              </h4>

              {/* CBC Form */}
              {selectedRequest.code_code === 'CBC' && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hemoglobin (g/dL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={resultForm.hemoglobin || ''}
                      onChange={(e) => setResultForm({ ...resultForm, hemoglobin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 14.2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ref: 12.0-16.0 g/dL</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RBC (x10^12/L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={resultForm.rbc || ''}
                      onChange={(e) => setResultForm({ ...resultForm, rbc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 4.8"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ref: 4.2-5.9 x10^12/L</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WBC (x10^9/L)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={resultForm.wbc || ''}
                      onChange={(e) => setResultForm({ ...resultForm, wbc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 7.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ref: 4.0-11.0 x10^9/L</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hematocrit (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={resultForm.hematocrit || ''}
                      onChange={(e) => setResultForm({ ...resultForm, hematocrit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 42"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ref: 37-47 %</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platelets (x10^9/L)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={resultForm.platelets || ''}
                      onChange={(e) => setResultForm({ ...resultForm, platelets: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 280"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ref: 150-400 x10^9/L</p>
                  </div>
                </div>
              )}

              {/* Urinalysis Form */}
              {selectedRequest.code_code === 'URINALYSIS' && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <select
                      value={resultForm.color || 'Yellow'}
                      onChange={(e) => setResultForm({ ...resultForm, color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Yellow">Yellow</option>
                      <option value="Pale Yellow">Pale Yellow</option>
                      <option value="Amber">Amber</option>
                      <option value="Red">Red</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Clarity</label>
                    <select
                      value={resultForm.clarity || 'Clear'}
                      onChange={(e) => setResultForm({ ...resultForm, clarity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Clear">Clear</option>
                      <option value="Hazy">Hazy</option>
                      <option value="Cloudy">Cloudy</option>
                      <option value="Turbid">Turbid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">pH</label>
                    <input
                      type="number"
                      step="0.1"
                      value={resultForm.ph || ''}
                      onChange={(e) => setResultForm({ ...resultForm, ph: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="5.0-8.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Protein</label>
                    <select
                      value={resultForm.protein || 'Negative'}
                      onChange={(e) => setResultForm({ ...resultForm, protein: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Trace">Trace</option>
                      <option value="+">+</option>
                      <option value="++">++</option>
                      <option value="+++">+++</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Glucose</label>
                    <select
                      value={resultForm.glucose || 'Negative'}
                      onChange={(e) => setResultForm({ ...resultForm, glucose: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Trace">Trace</option>
                      <option value="+">+</option>
                      <option value="++">++</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood</label>
                    <select
                      value={resultForm.blood || 'Negative'}
                      onChange={(e) => setResultForm({ ...resultForm, blood: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Negative">Negative</option>
                      <option value="Trace">Trace</option>
                      <option value="+">+</option>
                      <option value="++">++</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Findings</label>
                    <textarea
                      value={resultForm.findings || ''}
                      onChange={(e) => setResultForm({ ...resultForm, findings: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter general findings..."
                    />
                  </div>
                </div>
              )}

              {/* Generic Test Form */}
              {selectedRequest.code_code !== 'CBC' && selectedRequest.code_code !== 'URINALYSIS' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Findings</label>
                  <textarea
                    value={resultForm.findings || ''}
                    onChange={(e) => setResultForm({ ...resultForm, findings: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter test results and findings..."
                  />
                </div>
              )}

              {/* Interpretation (CBC only, auto-generated for others) */}
              {selectedRequest.code_code === 'CBC' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Interpretation (Optional)
                  </label>
                  <textarea
                    value={resultForm.interpretation || ''}
                    onChange={(e) => setResultForm({ ...resultForm, interpretation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional clinical interpretation or recommendations..."
                  />
                </div>
              )}

              {/* Technician Details */}
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 mt-6 flex items-center gap-2">
                <User size={16} />
                Technician Details
              </h4>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Technologist *
                  </label>
                  <input
                    type="text"
                    value={resultForm.technicianName || ''}
                    onChange={(e) => setResultForm({ ...resultForm, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License No. *
                  </label>
                  <input
                    type="text"
                    value={resultForm.technicianLicense || ''}
                    onChange={(e) => setResultForm({ ...resultForm, technicianLicense: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., RMT-12345"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEncodeModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResults}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Check size={18} />
                  Finalize & Submit Results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Results Modal */}
      {showPrintModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Green Theme */}
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-white" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Laboratory Test Result</h3>
                  <p className="text-sm text-green-100">{selectedRequest.code_display}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <Printer size={16} />
                  Print Report
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-white hover:bg-green-700 rounded-full p-2 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-8">
                  {/* Hospital Header */}
                  <div className="text-center mb-6 pb-4 border-b-2 border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">WAH 4 HOSPITAL</h1>
                    <p className="text-sm text-gray-600 mt-1">Laboratory Department</p>
                    <p className="text-sm text-gray-600">123 Health Avenue, Medical City</p>
                  </div>

                  {/* Patient & Test Info Grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-32">Patient:</span>
                      <span className="text-gray-900">{selectedRequest.subject_display}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-32">Patient ID:</span>
                      <span className="text-gray-900">{selectedRequest.subject_patient_id}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-32">Test Code:</span>
                      <span className="text-gray-900">{selectedRequest.code_code}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-32">Priority:</span>
                      <span className={`font-medium ${
                        selectedRequest.priority === 'stat' ? 'text-red-600' :
                        selectedRequest.priority === 'urgent' ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {selectedRequest.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-32">Ordered By:</span>
                      <span className="text-gray-900">{selectedRequest.orderedBy}</span>
                    </div>
                    <div className="flex">
                      <span className="font-semibold text-gray-700 w-32">Completed At:</span>
                      <span className="text-gray-900">
                        {selectedRequest.processedAt 
                          ? new Date(selectedRequest.processedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Findings Section */}
                  {selectedRequest.conclusion && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Findings</h3>
                      <p className="text-sm text-gray-800">{selectedRequest.conclusion}</p>
                    </div>
                  )}

                  {/* Test Results Table */}
                  {selectedRequest.results && selectedRequest.results.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase">Test Results</h3>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-t border-b border-gray-300">
                            <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase text-xs">
                              Parameter
                            </th>
                            <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase text-xs">
                              Value
                            </th>
                            <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase text-xs">
                              Unit
                            </th>
                            <th className="px-4 py-2.5 text-left font-bold text-gray-900 uppercase text-xs">
                              Reference Range
                            </th>
                            <th className="px-4 py-2.5 text-center font-bold text-gray-900 uppercase text-xs">
                              Flag
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRequest.results.map((result, index) => (
                            <tr 
                              key={index}
                              className={`border-b border-gray-200 ${
                                result.flag === 'HIGH' || result.flag === 'LOW' ? 'bg-red-50' : 
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-2.5 font-medium text-gray-900">
                                {result.parameter}
                              </td>
                              <td className="px-4 py-2.5 text-gray-900 font-semibold">
                                {result.value}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {result.unit}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {result.referenceRange}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {result.flag && result.flag !== 'NORMAL' ? (
                                  <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                                    result.flag === 'HIGH' ? 'bg-red-600 text-white' :
                                    result.flag === 'LOW' ? 'bg-orange-600 text-white' :
                                    result.flag === 'CRITICAL' ? 'bg-red-700 text-white' :
                                    'bg-gray-200 text-gray-700'
                                  }`}>
                                    {result.flag}
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Clinical Interpretation - Yellow Warning Box */}
                  {selectedRequest.conclusion && (
                    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 mb-1">Clinical Interpretation</h4>
                          <p className="text-sm text-gray-800">{selectedRequest.conclusion}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Signatures Section */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-300">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="mb-2">
                          <div className="h-12 border-b-2 border-gray-400 mb-1"></div>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedRequest.processedBy || 'Lab Tech Maria Santos'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Registered Medical Technologist</p>
                        <p className="text-xs text-gray-500">Lic. No. 1</p>
                      </div>
                      <div>
                        <div className="mb-2">
                          <div className="h-12 border-b-2 border-gray-400 mb-1"></div>
                          <p className="text-sm font-bold text-gray-900">Dr. Pathologist, MD, FPSP</p>
                        </div>
                        <p className="text-xs text-gray-600 uppercase font-semibold">Pathologist</p>
                        <p className="text-xs text-gray-500">Lic. No. 0012345</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>
                        <p>Reported by: {selectedRequest.processedBy || 'Lab Tech Maria Santos'}</p>
                        <p>Report Date: {selectedRequest.processedAt 
                          ? new Date(selectedRequest.processedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            }) + 'Z'
                          : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">FHIR DiagnosticReport</p>
                        <p>Status: Final</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-100 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-6 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Printer size={18} />
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
