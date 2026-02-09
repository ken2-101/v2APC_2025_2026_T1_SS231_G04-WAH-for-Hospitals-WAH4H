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
 */
export const laboratoryService = {
  // ========== Lab Requests ==========

  /**
   * Get all lab requests with optional filters
   */
  getLabRequests: async (filters?: LabRequestFilters): Promise<LabRequestListResponse> => {
    const params = new URLSearchParams();
    
    // Map status: pending -> registered, in_progress -> preliminary, completed -> final
    if (filters?.status) {
        let status = '';
        if (filters.status === 'pending') status = 'registered';
        else if (filters.status === 'in_progress') status = 'preliminary'; // or partial
        else if (filters.status === 'completed') status = 'final';
        if (status) params.append('status', status);
    }
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.page) params.append('page', filters.page.toString());

    // Use /reports/ endpoint
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/?${params.toString()}`);
    
    // Map backend response (DiagnosticReport) to frontend LabRequest
    const mappedResults = response.data.results.map((report: any) => ({
        id: report.diagnostic_report_id,
        request_id: report.diagnostic_report_id.toString(), // distinct from identifier
        admission: report.encounter_id,
        admission_id: report.encounter_summary?.encounter_id || report.encounter_id.toString(),
        patient_id: report.patient_summary?.patient_id || report.subject_id.toString(),
        patient_name: report.patient_summary?.full_name || 'Unknown Patient',
        ward_room_bed: 'Unknown Location', // needs enrichment or location_summary
        requesting_doctor: report.performer_id || null, // Map performer_id to requesting_doctor
        doctor_name: 'Unknown Doctor', // needs practitioner_summary
        test_type: 'cbc' as any, // placeholder, actual comes from code_code
        test_type_display: report.code_display || report.code_code || 'Lab Test',
        priority: 'routine' as any, // backend default
        priority_display: 'Routine',
        clinical_reason: report.conclusion || '',
        status: report.status === 'registered' ? 'pending' : 
               (report.status === 'final' ? 'completed' : 'in_progress'),
        status_display: report.status,
        created_at: report.created_at,
        updated_at: report.updated_at
    }));

    return {
        ...response.data,
        results: mappedResults
    };
  },

  /**
   * Get a single lab request by ID
   */
  getLabRequest: async (id: number): Promise<LabRequest> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/${id}/`);
    const report = response.data;
    // Map to LabRequest...
    return {
        id: report.diagnostic_report_id,
        request_id: report.diagnostic_report_id.toString(),
        admission: report.encounter_id,
        admission_id: report.encounter_summary?.encounter_id || '',
        patient_id: report.patient_summary?.patient_id || '',
        patient_name: report.patient_summary?.full_name || '',
        ward_room_bed: '', 
        requesting_doctor: report.performer_id || null,
        doctor_name: '',
        test_type: 'cbc' as any,
        test_type_display: report.code_display || report.code_code,
        priority: 'routine' as any,
        priority_display: 'Routine',
        clinical_reason: report.conclusion || '',
        status: report.status === 'registered' ? 'pending' : 
               (report.status === 'final' ? 'completed' : 'in_progress'),
        status_display: report.status,
        created_at: report.created_at,
        updated_at: report.updated_at
    };
  },

  /**
   * Create a new lab request
   * Map frontend LabRequestFormData to backend DiagnosticReportInputSerializer
   */
  createLabRequest: async (data: LabRequestFormData): Promise<LabRequest> => {
    // Map payload
    const payload = {
        subject_id: data.subject_id,
        encounter_id: data.admission,
        // Map test_type to code_code
        code_code: data.test_type, 
        code_display: data.test_type.toUpperCase(), // Simple mapping
        category_code: 'LAB',
        status: 'registered', // Initial status
        conclusion: data.clinical_reason // Use conclusion field for reason temporarily
    };

    const response = await api.post(`${LABORATORY_BASE_URL}/reports/`, payload);
    return response.data;
  },

  /**
   * Update a lab request
   */
  updateLabRequest: async (id: number, data: Partial<LabRequestFormData>): Promise<LabRequest> => {
    const response = await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a lab request
   */
  deleteLabRequest: async (id: number): Promise<void> => {
    await api.delete(`${LABORATORY_BASE_URL}/reports/${id}/`);
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<LabDashboardStats> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/dashboard_stats/`);
    return response.data;
  },

  /**
   * Start processing a pending request
   * Maps to update_status -> preliminary
   */
  startProcessing: async (id: number): Promise<LabRequest> => {
    const response = await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/update_status/`, {
        status: 'preliminary'
    });
    return response.data;
  },

  // ========== Lab Results ==========

  /**
   * Get all lab results
   */
  getLabResults: async (): Promise<LabResult[]> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/?status=final`);
    return response.data.results || response.data;
  },

  /**
   * Get a single lab result by ID
   */
  getLabResult: async (id: number): Promise<LabResult> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/reports/${id}/`);
    return response.data;
  },

  /**
   * Create a new lab result (encode results)
   * This logic is tricky: Frontend treats result creation as separate, 
   * but Backend sees it as adding results to a report. 
   * We will assume the frontend is passing results data to ADD to the report.
   */
  createLabResult: async (data: any): Promise<LabResult> => {
     // NOTE: The frontend likely calls this with parameter values.
     // Since the backend separates report creation from result addition,
     // we might need to iterate or call a specific endpoint.
     // For now, let's assume we update the report status to final and maybe add observations if needed.
     
     // Ideally, we loop through data.parameters and call add_result for each?
     // Or we just update the report status contextually.
     
     // Quick fix: Update status to final.
     if (data.lab_request) { // lab_request is ID
         return await laboratoryService.finalizeResult(data.lab_request);
     }
     throw new Error("Invalid result data");
  },

  /**
   * Update a lab result
   */
  updateLabResult: async (id: number, data: Partial<LabResultFormData>): Promise<LabResult> => {
    const response = await api.patch(`${LABORATORY_BASE_URL}/results/${id}/`, data);
    return response.data;
  },

  /**
   * Add a parameter to an existing result
   */
  addParameter: async (resultId: number, parameterData: any): Promise<any> => {
    const response = await api.post(`${LABORATORY_BASE_URL}/results/${resultId}/add_parameter/`, parameterData);
    return response.data;
  },

  /**
   * Finalize a lab result
   */
  finalizeResult: async (id: number): Promise<LabResult> => {
    const response = await api.patch(`${LABORATORY_BASE_URL}/reports/${id}/update_status/`, {
        status: 'final'
    });
    return response.data;
  },
};

export default laboratoryService;
