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
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.test_type) params.append('test_type', filters.test_type);
    if (filters?.requesting_doctor) params.append('requesting_doctor', filters.requesting_doctor.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await api.get(`${LABORATORY_BASE_URL}/requests/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single lab request by ID
   */
  getLabRequest: async (id: number): Promise<LabRequest> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/requests/${id}/`);
    return response.data;
  },

  /**
   * Create a new lab request
   */
  createLabRequest: async (data: LabRequestFormData): Promise<LabRequest> => {
    const response = await api.post(`${LABORATORY_BASE_URL}/requests/`, data);
    return response.data;
  },

  /**
   * Update a lab request
   */
  updateLabRequest: async (id: number, data: Partial<LabRequestFormData>): Promise<LabRequest> => {
    const response = await api.patch(`${LABORATORY_BASE_URL}/requests/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a lab request
   */
  deleteLabRequest: async (id: number): Promise<void> => {
    await api.delete(`${LABORATORY_BASE_URL}/requests/${id}/`);
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<LabDashboardStats> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/requests/dashboard_stats/`);
    return response.data;
  },

  /**
   * Start processing a pending request
   */
  startProcessing: async (id: number): Promise<LabRequest> => {
    const response = await api.post(`${LABORATORY_BASE_URL}/requests/${id}/start_processing/`);
    return response.data;
  },

  // ========== Lab Results ==========

  /**
   * Get all lab results
   */
  getLabResults: async (): Promise<LabResult[]> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/results/`);
    return response.data.results || response.data;
  },

  /**
   * Get a single lab result by ID
   */
  getLabResult: async (id: number): Promise<LabResult> => {
    const response = await api.get(`${LABORATORY_BASE_URL}/results/${id}/`);
    return response.data;
  },

  /**
   * Create a new lab result (encode results)
   */
  createLabResult: async (data: LabResultFormData): Promise<LabResult> => {
    const response = await api.post(`${LABORATORY_BASE_URL}/results/`, data);
    return response.data;
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
    const response = await api.post(`${LABORATORY_BASE_URL}/results/${id}/finalize/`);
    return response.data;
  },
};

export default laboratoryService;
