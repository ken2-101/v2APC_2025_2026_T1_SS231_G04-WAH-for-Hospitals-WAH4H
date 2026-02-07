// src/types/admission.ts

/**
 * Location hierarchy structure for the UI
 */
export interface AdmissionLocation {
  building: string;
  wing?: string;
  ward: string;
  room: string;
  bed: string;
}

/**
 * Procedure structure for the UI
 */
export interface AdmissionProcedure {
  id: number | string;
  code: string;
  name: string;
  status: string;
  performedDate: string;
  performer: string;
  outcome: string;
}

/**
 * Represents the Admission object as used in the UI
 */
export interface Admission {
  id: string | number;
  patientId: string;
  patientName: string;
  admissionNo: string;
  admissionDate: string; // ISO string or formatted string
  dischargeDate: string | null;
  
  // Clinical & Staff
  physician: string;
  serviceType: string;
  diagnosis: string;
  reason?: string;
  priority: 'routine' | 'urgent' | 'asap' | 'emergency' | 'high';
  status: 'in-progress' | 'planned' | 'finished' | 'cancelled';
  
  // Location
  location: AdmissionLocation;
  
  // Logistics
  admitSource?: string;
  dietPreference?: string[];
  specialArrangements?: string[];
  
  // Related Records
  procedures?: AdmissionProcedure[];
  
  // Legacy/Backend fields (Optional for now)
  encounter_id?: number;
  subject_id?: number;
}

/**
 * Payload for creating a new admission
 */
export type NewAdmission = Omit<Admission, 'id' | 'admissionNo' | 'status' | 'dischargeDate' | 'procedures'>;