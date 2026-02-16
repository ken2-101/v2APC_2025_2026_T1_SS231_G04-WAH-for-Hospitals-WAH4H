// src/types/discharge.ts

// Discharge requirements - only track requirements from OTHER modules
// Discharge form fields are handled in the form itself
export interface DischargeRequirements {
  billing_cleared: boolean;           // From billing module
  medication_reconciliation: boolean; // From pharmacy module
  nursing_notes: boolean;             // From nursing/monitoring module
}

export interface DischargeRecord {
  discharge_id: number;
  encounter_id: number;
  patient_id: number;
  physician_id?: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  status: 'pending' | 'ready' | 'discharged';
  workflow_status: 'pending' | 'ready' | 'discharged';
  physician: string;
  department: string;
  age: number;
  estimatedDischarge?: string;
  requirements: DischargeRequirements;
  dischargeDate?: string;
  discharge_datetime?: string;
  finalDiagnosis?: string;
  summary_of_stay?: string;
  discharge_instructions?: string;
  dischargeSummary?: string;
  followUpRequired?: boolean;
  followUpPlan?: string;
  follow_up_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingPatient {
  discharge_id?: number;
  id?: number;
  encounter_id: number;
  patient_id: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  status: 'pending' | 'ready' | 'discharged';
  workflow_status: 'pending' | 'ready' | 'discharged';
  physician: string;
  department: string;
  age: number;
  estimatedDischarge: string;
  requirements: DischargeRequirements;
}

export interface DischargedPatient {
  discharge_id: number;
  id: number;  // Made required for component compatibility
  patientName: string;
  room: string;
  admissionDate: string;
  dischargeDate: string;
  condition: string;
  physician: string;
  department: string;
  age: number;
  finalDiagnosis: string;
  dischargeSummary: string;
  followUpRequired: boolean;
  followUpPlan?: string;
}

export interface DischargeForm {
  patientId?: number;
  finalDiagnosis: string;
  hospitalStaySummary: string;
  dischargeMedications: string;
  dischargeInstructions: string;
  followUpPlan?: string;
  billingStatus?: string;
  pendingItems?: string;
}

export interface NewDischargeRecord {
  patient_id: number;
  encounter_id: number;
  admission?: number;
  patientName: string;
  room: string;
  admissionDate: string;
  condition: string;
  status?: 'pending' | 'ready' | 'discharged';
  physician: string;
  department: string;
  age: number;
  estimatedDischarge?: string;
}

