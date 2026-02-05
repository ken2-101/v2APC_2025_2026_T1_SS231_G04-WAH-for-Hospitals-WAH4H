// Lab Request Types
export type LabTestType = 'cbc' | 'urinalysis' | 'fecalysis' | 'xray' | 'ultrasound' | 'ecg' | 'blood_chemistry';
export type LabPriority = 'routine' | 'stat';
export type LabStatus = 'pending' | 'in_progress' | 'completed';
export type LabInterpretation = 'normal' | 'high' | 'low';

// Test Parameter
export interface TestParameter {
  id: number;
  parameter_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  interpretation: LabInterpretation | '';
  created_at: string;
}

export interface TestParameterFormData {
  parameter_name: string;
  result_value: string;
  unit?: string;
  reference_range?: string;
  interpretation?: LabInterpretation | '';
}

// Lab Result
export interface LabResult {
  id: number;
  request_id: string;
  lab_request: number;
  patient_name: string;
  doctor_name: string | null;
  test_type: string;
  medical_technologist: string;
  prc_number: string;
  remarks: string;
  performed_by: number | null;
  parameters: TestParameter[];
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabResultFormData {
  lab_request: number;
  medical_technologist: string;
  prc_number: string;
  remarks?: string;
  performed_by?: number;
  parameters?: TestParameterFormData[];
}

// Lab Request
export interface LabRequest {
  id: number;
  request_id: string;
  admission: number;
  admission_id: string;
  patient_id: string;
  patient_name: string;
  ward_room_bed: string;
  patient_details?: {
    patient_id: string;
    full_name: string;
    date_of_birth: string | null;
    sex: string;
    mobile_number: string;
  };
  requesting_doctor: number | null;
  doctor_name: string | null;
  test_type: LabTestType;
  test_type_display: string;
  priority: LabPriority;
  priority_display: string;
  clinical_reason: string;
  status: LabStatus;
  status_display: string;
  has_result?: boolean;
  result?: LabResult;
  created_at: string;
  updated_at: string;
}

export interface LabRequestFormData {
  subject_id: number;
  admission: number;
  requesting_doctor: number;
  test_type: LabTestType;
  priority: LabPriority;
  clinical_reason?: string;
}

// Dashboard Stats
export interface LabDashboardStats {
  pending: number;
  in_progress: number;
  completed_today: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LabRequestListResponse extends PaginatedResponse<LabRequest> {}
export interface LabResultListResponse extends PaginatedResponse<LabResult> {}

// Filter/Search Params
export interface LabRequestFilters {
  status?: LabStatus;
  priority?: LabPriority;
  test_type?: LabTestType;
  requesting_doctor?: number;
  search?: string;
  ordering?: string;
  page?: number;
}