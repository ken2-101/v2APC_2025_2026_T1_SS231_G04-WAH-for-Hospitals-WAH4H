import api from './api';
import {
  LabRequest,
  LabResult,
  LabRequestFormData,
  LabResultFormData,
  LabDashboardStats,
  LabRequestListResponse,
  LabRequestFilters,
} from '../types/laboratory';

const LABORATORY_BASE_URL = '/api/laboratory';

/**
 * Laboratory Service
 * Handles all API calls for the Laboratory module
 * Maps backend DiagnosticReport model to frontend LabRequest/LabResult types
 */
export const laboratoryService = {
  // ========== Lab Requests ==========

  /**
   * Get all lab requests with optional filters
   * Backend endpoint: GET /api/laboratory/reports/
   */
  getLabRequests: async (filters?: LabRequestFilters): Promise<LabRequestListResponse> => {
    const params = new URLSearchParams();

    // Map frontend status to backend status
    if (filters?.status) {
      let backendStatus = '';
      if (filters.status === 'pending') backendStatus = 'registered';
      else if (filters.status === 'in_progress') backendStatus = 'preliminary';
      else if (filters.status === 'completed') backendStatus = 'final';
      if (backendStatus) params.append('status', backendStatus);
    }

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.requesting_doctor) params.append('performer_id', filters.requesting_doctor.toString());

    // Patient-specific filtering
    if (filters?.subject_id) params.append('subject_id', filters.subject_id.toString());
    if (filters?.encounter_id) params.append('encounter_id', filters.encounter_id.toString());

    const response = await api.get(`${LABORATORY_BASE_URL}/reports/?${params.toString()}`);

    // Map backend DiagnosticReport to frontend LabRequest
    const mappedResults = response.data.results.map((report: any) => ({
      id: report.diagnostic_report_id,
      request_id: report.identifier || report.diagnostic_report_id.toString(),
      admission: report.encounter_id,
      admission_id: report.encounter?.identifier || report.encounter_id?.toString() || '',
      patient_id: report.subject_patient_id || report.subject_id?.toString() || '',
      patient_name: report.subject_display || 'Unknown Patient',
      ward_room_bed: '', // Not available in current backend
      requesting_doctor: report.requester_id || null,
      doctor_name: report.orderedBy || null,
      test_type: report.code_code || 'cbc',
      test_type_display: report.code_display || report.code_code || 'Lab Test',
      priority: report.priority || 'routine', // Now using actual backend field
      priority_display: report.priority === 'stat' ? 'STAT' : report.priority === 'urgent' ? 'Urgent' : 'Routine',
      clinical_reason: report.conclusion || '',
      status: mapBackendStatusToFrontend(report.status),
      status_display: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at
    }));

    return {
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      results: mappedResults
    };
  },

  /**
   * Get a single lab request by ID
   * Backend endpoint: GET /api/laboratory/reports/{id}/
   */
  getLabRequest: async (id: number): Promise<LabRequest> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/${id}/`);
    const report = response.data;

    return {
      id: report.diagnostic_report_id,
      request_id: report.identifier || report.diagnostic_report_id.toString(),
      admission: report.encounter_id,
      admission_id: report.encounter?.identifier || report.encounter_id?.toString() || '',
      patient_id: report.subject_patient_id || report.subject_id?.toString() || '',
      patient_name: report.subject_display || 'Unknown Patient',
      ward_room_bed: '',
      patient_details: report.subject ? {
        patient_id: report.subject.patient_id,
        full_name: report.subject.name,
        date_of_birth: report.subject.date_of_birth || null,
        sex: report.subject.sex || '',
        mobile_number: report.subject.mobile_number || ''
      } : undefined,
      requesting_doctor: report.requester_id || null,
      doctor_name: report.orderedBy || null,
      test_type: report.code_code || 'cbc',
      test_type_display: report.code_display || report.code_code || 'Lab Test',
      priority: report.priority || 'routine',
      priority_display: report.priority === 'stat' ? 'STAT' : report.priority === 'urgent' ? 'Urgent' : 'Routine',
      clinical_reason: report.conclusion || '',
      status: mapBackendStatusToFrontend(report.status),
      status_display: report.status,
      has_result: report.status === 'final',
      created_at: report.created_at,
      updated_at: report.updated_at
    };
  },

  /**
   * Create a new lab request
   * Backend endpoint: POST /api/laboratory/reports/
   */
  createLabRequest: async (data: LabRequestFormData): Promise<LabRequest> => {
    // Generate unique identifier for the request
    const identifier = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payload = {
      identifier: identifier,  // Required field
      subject_id: data.subject_id,
      encounter_id: data.admission,
      requester_id: data.requesting_doctor,  // Changed from performer_id to requester_id
      code_code: data.test_type,
      code_display: getTestTypeDisplay(data.test_type),
      category_code: 'LAB',
      priority: data.priority,  // Now sending priority to backend
      status: 'registered',
      conclusion: data.clinical_reason || ''
    };

    const response = await api.post(`${LABORATORY_BASE_URL}/reports/`, payload);
    const report = response.data;

    return {
      id: report.diagnostic_report_id,
      request_id: report.identifier || report.diagnostic_report_id.toString(),
      admission: report.encounter_id,
      admission_id: report.encounter_id?.toString() || '',
      patient_id: report.subject_id?.toString() || '',
      patient_name: report.subject?.name || '',
      ward_room_bed: '',
      requesting_doctor: report.performer_id,
      doctor_name: report.performer?.name || null,
      test_type: report.code_code,
      test_type_display: report.code_display,
      priority: data.priority,
      priority_display: data.priority === 'stat' ? 'STAT' : 'Routine',
      clinical_reason: report.conclusion,
      status: 'pending',
      status_display: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at
    };
  },

  /**
   * Update a lab request
   * Backend endpoint: PATCH /api/laboratory/reports/{id}/
   */
  updateLabRequest: async (id: number, data: Partial<LabRequestFormData>): Promise<LabRequest> => {
    const payload: any = {};
    if (data.subject_id) payload.subject_id = data.subject_id;
    if (data.admission) payload.encounter_id = data.admission;
    if (data.requesting_doctor) payload.performer_id = data.requesting_doctor;
    if (data.test_type) {
      payload.code_code = data.test_type;
      payload.code_display = getTestTypeDisplay(data.test_type);
    }
    if (data.clinical_reason !== undefined) payload.conclusion = data.clinical_reason;

    const response = await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/`, payload);
    return laboratoryService.getLabRequest(id);
  },

  /**
   * Delete a lab request
   * Backend endpoint: DELETE /api/laboratory/reports/{id}/
   */
  deleteLabRequest: async (id: number): Promise<void> => {
    await api.delete(`${LABORATORY_BASE_URL}/reports/${id}/`);
  },

  /**
   * Get dashboard statistics
   * Backend endpoint: GET /api/laboratory/reports/dashboard_stats/
   */
  getDashboardStats: async (): Promise<LabDashboardStats> => {
    // Use the new efficient endpoint
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/dashboard_stats/`);
    return response.data;
  },

  /**
   * Start processing a pending request
   * Backend endpoint: PATCH /api/laboratory/reports/{id}/update-status/
   */
  startProcessing: async (id: number): Promise<LabRequest> => {
    await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/update_status/`, {
      status: 'preliminary'
    });
    return laboratoryService.getLabRequest(id);
  },

  // ========== Lab Results ==========

  /**
   * Get all lab results (finalized reports)
   * Backend endpoint: GET /api/laboratory/reports/?status=final
   */
  getLabResults: async (): Promise<LabResult[]> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/?status=final`);
    const reports = response.data.results || response.data;

    return reports.map((report: any) => {
      // Handle legacy results (array) vs new results (object with meta)
      const rawResults = report.results;
      let parameters = [];
      let meta = { medical_technologist: '', prc_number: '' };

      if (Array.isArray(rawResults)) {
        parameters = rawResults;
      } else if (rawResults && typeof rawResults === 'object') {
        parameters = rawResults.parameters || [];
        meta = rawResults.meta || meta;
      }

      return {
        id: report.diagnostic_report_id,
        request_id: report.identifier || report.diagnostic_report_id.toString(),
        lab_request: report.diagnostic_report_id,
        patient_name: report.subject?.name || 'Unknown Patient',
        doctor_name: report.performer?.name || null,
        test_type: report.code_display || report.code_code || 'Lab Test',
        medical_technologist: meta.medical_technologist || '',
        prc_number: meta.prc_number || '',
        remarks: report.conclusion || '',
        performed_by: report.performer_id,
        parameters: parameters,
        finalized_at: report.issued_datetime,
        created_at: report.created_at,
        updated_at: report.updated_at
      };
    });
  },

  /**
   * Get a single lab result by ID
   * Backend endpoint: GET /api/laboratory/reports/{id}/
   */
  getLabResult: async (id: number): Promise<LabResult> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/${id}/`);
    const report = response.data;

    // Handle legacy results (array) vs new results (object with meta)
    const rawResults = report.results;
    let parameters = [];
    let meta = { medical_technologist: '', prc_number: '' };

    if (Array.isArray(rawResults)) {
      parameters = rawResults;
    } else if (rawResults && typeof rawResults === 'object') {
      parameters = rawResults.parameters || [];
      meta = rawResults.meta || meta;
    }

    return {
      id: report.diagnostic_report_id,
      request_id: report.identifier || report.diagnostic_report_id.toString(),
      lab_request: report.diagnostic_report_id,
      patient_name: report.subject?.name || 'Unknown Patient',
      doctor_name: report.performer?.name || null,
      test_type: report.code_display || report.code_code || 'Lab Test',
      medical_technologist: meta.medical_technologist || '',
      prc_number: meta.prc_number || '',
      remarks: report.conclusion || '',
      performed_by: report.performer_id,
      parameters: parameters,
      finalized_at: report.issued_datetime,
      created_at: report.created_at,
      updated_at: report.updated_at
    };
  },

  /**
   * Create a new lab result (finalize a report with results)
   * Backend endpoint: PATCH /api/laboratory/reports/{id}/update-status/
   */
  createLabResult: async (data: LabResultFormData): Promise<LabResult> => {
    // Structure the payload to match what the backend JSONField expects
    // This payload is stored directly in 'result_data'
    const resultPayload = {
      parameters: data.parameters,
      meta: {
        medical_technologist: data.medical_technologist,
        prc_number: data.prc_number,
        remarks: data.remarks
      }
    };

    // Update the report to final status
    await api.patch(`${LABORATORY_BASE_URL}/reports/${data.lab_request}/update_status/`, {
      status: 'final',
      conclusion: data.remarks || '',
      results: resultPayload // This maps to 'result_data' in the serializer
    });

    // Return the updated result
    return laboratoryService.getLabResult(data.lab_request);
  },

  /**
   * Update a lab result
   * Backend endpoint: PATCH /api/laboratory/reports/{id}/
   */
  updateLabResult: async (id: number, data: Partial<LabResultFormData>): Promise<LabResult> => {
    const payload: any = {};
    if (data.remarks !== undefined) payload.conclusion = data.remarks;
    if (data.parameters !== undefined) payload.results = data.parameters;

    await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/`, payload);
    return laboratoryService.getLabResult(id);
  },

  /**
   * Finalize a lab result
   * Backend endpoint: POST /api/laboratory/reports/{id}/finalize/
   */
  finalizeResult: async (id: number): Promise<LabResult> => {
    try {
      await api.post(`${LABORATORY_BASE_URL}/reports/${id}/finalize/`);
    } catch (error) {
      // Fallback to update_status if finalize endpoint doesn't exist
      await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/update_status/`, {
        status: 'final'
      });
    }
    return laboratoryService.getLabResult(id);
  },
};

// Helper functions

/**
 * Map backend status to frontend status
 */
function mapBackendStatusToFrontend(backendStatus: string): 'pending' | 'in_progress' | 'completed' {
  switch (backendStatus) {
    case 'registered':
      return 'pending';
    case 'preliminary':
    case 'partial':
      return 'in_progress';
    case 'final':
    case 'amended':
    case 'corrected':
      return 'completed';
    default:
      return 'pending';
  }
}

/**
 * Get display name for test type
 */
function getTestTypeDisplay(testType: string): string {
  const displayMap: Record<string, string> = {
    // Hematology
    'cbc': 'Complete Blood Count',
    'platelet_count': 'Platelet Count',
    'blood_typing': 'Blood Typing',
    'clotting_time': 'Clotting Time',
    'bleeding_time': 'Bleeding Time',
    // Clinical Microscopy
    'urinalysis': 'Urinalysis',
    'fecalysis': 'Fecalysis',
    'pregnancy_test': 'Pregnancy Test',
    // Blood Chemistry
    'fbs': 'Fasting Blood Sugar',
    'rbs': 'Random Blood Sugar',
    'lipid_profile': 'Lipid Profile',
    'creatinine': 'Creatinine',
    'bua': 'Blood Uric Acid',
    'bun': 'Blood Urea Nitrogen',
    'sgpt': 'SGPT / ALT',
    'sgot': 'SGOT / AST',
    'electrolytes': 'Electrolytes',
    'blood_chemistry': 'Blood Chemistry Package',
    // Serology
    'hbsag': 'HBsAg (Hepatitis B)',
    'syphilis': 'Syphilis Test',
    'dengue_duo': 'Dengue Duo Test',
    'typhoid': 'Typhoid Test',
    // Microbiology
    'gram_stain': 'Gram Stain',
    'afb_stain': 'AFB Stain',
    // Legacy
    'lipid_panel': 'Lipid Panel'
  };
  return displayMap[testType] || testType.toUpperCase();
}

export default laboratoryService;
